'use client'

import { useViewer } from '@pascal-app/viewer'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js'

export function ExportManager() {
  const scene = useThree((state) => state.scene)
  const setExportScene = useViewer((state) => state.setExportScene)

  useEffect(() => {
    const exportFn = async (
      format: 'glb' | 'stl' | 'obj' | 'usdz' = 'glb',
      options?: { download?: boolean },
    ): Promise<Blob | void> => {
      // Find the scene renderer group by name
      const sceneGroup = scene.getObjectByName('scene-renderer')
      if (!sceneGroup) {
        console.error('scene-renderer group not found')
        return
      }

      const shouldDownload = options?.download !== false
      const date = new Date().toISOString().split('T')[0]

      const emit = (blob: Blob, filename: string): Blob => {
        if (shouldDownload) downloadBlob(blob, filename)
        return blob
      }

      if (format === 'stl') {
        const exporter = new STLExporter()
        const result = exporter.parse(sceneGroup, { binary: true })
        return emit(new Blob([result], { type: 'model/stl' }), `model_${date}.stl`)
      }

      if (format === 'obj') {
        const exporter = new OBJExporter()
        const result = exporter.parse(sceneGroup)
        return emit(new Blob([result], { type: 'model/obj' }), `model_${date}.obj`)
      }

      if (format === 'usdz') {
        // USDZ only carries { baseColor, roughness, metalness, normal }; Quick
        // Look ignores the rest. Geometry is already CSG-baked in scene-renderer.
        const exporter = new USDZExporter()
        const result = await exporter.parseAsync(sceneGroup)
        return emit(
          new Blob([result as BufferSource], { type: 'model/vnd.usdz+zip' }),
          `model_${date}.usdz`,
        )
      }

      // Default: GLB export
      const exporter = new GLTFExporter()

      return new Promise<Blob>((resolve, reject) => {
        exporter.parse(
          sceneGroup,
          (gltf) => {
            const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' })
            resolve(emit(blob, `model_${date}.glb`))
          },
          (error) => {
            console.error('Export error:', error)
            reject(error)
          },
          { binary: true },
        )
      })
    }

    setExportScene(exportFn)

    return () => {
      setExportScene(null)
    }
  }, [scene, setExportScene])

  return null
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
