'use client'

import {
  type CameraControlEvent,
  type CameraControlFitSceneEvent,
  emitter,
  sceneRegistry,
  useScene,
} from '@pascal-app/core'
import { GRID_LAYER, useViewer, ZONE_LAYER } from '@pascal-app/viewer'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Box3, Vector2, Vector3 } from 'three'
import { EDITOR_LAYER } from '../../lib/constants'
import useEditor from '../../store/use-editor'

const currentTarget = new Vector3()
const tempBox = new Box3()
const tempCenter = new Vector3()
const tempDelta = new Vector3()
const tempPosition = new Vector3()
const tempSize = new Vector3()
const tempTarget = new Vector3()
const DEFAULT_MAX_POLAR_ANGLE = Math.PI / 2 - 0.1
const DEBUG_MAX_POLAR_ANGLE = Math.PI - 0.05

// Distance limits for the custom zoom-toward-cursor handler. These MUST
// match the minDistance / maxDistance props on <CameraControls> below,
// because our custom wheel handler calls setLookAt() directly and that
// bypasses the library's own min/max clamping. Without replicating the
// clamp here the camera runs away — it either flies miles out (the whole
// layout collapses to a dot in the centre) or punches straight through a
// wall/floor when zooming in. Keep these three values in sync.
const MIN_ZOOM_DIST = 0.5
const MAX_ZOOM_DIST = 60

export const CustomCameraControls = () => {
  const controls = useRef<CameraControlsImpl>(null!)
  const isPreviewMode = useEditor((s) => s.isPreviewMode)
  const isFirstPersonMode = useEditor((s) => s.isFirstPersonMode)
  const allowUndergroundCamera = useEditor((s) => s.allowUndergroundCamera)
  const selection = useViewer((s) => s.selection)
  const currentLevelId = selection.levelId
  const firstLoad = useRef(true)
  const maxPolarAngle =
    !isPreviewMode && allowUndergroundCamera ? DEBUG_MAX_POLAR_ANGLE : DEFAULT_MAX_POLAR_ANGLE

  const camera = useThree((state) => state.camera)
  const raycaster = useThree((state) => state.raycaster)
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const cameraModeForZoom = useViewer((s) => s.cameraMode)
  useEffect(() => {
    camera.layers.enable(EDITOR_LAYER)
    camera.layers.enable(GRID_LAYER)
    raycaster.layers.enable(EDITOR_LAYER)
    raycaster.layers.enable(ZONE_LAYER)
  }, [camera, raycaster])

  // Zoom-toward-cursor — proper version. Owner spec: cast a ray from
  // the camera through the cursor, find the world point under it
  // (scene hit, else a point along the ray at the current focus
  // distance), then move BOTH the camera position AND the orbit
  // target by the same delta toward/away from that point. Translating
  // them together is what preserves the look direction and avoids the
  // "sliding" that happens when only one of them moves.
  //
  // Library's wheel action is set to NONE for perspective (see
  // mouseButtons + updateConfig overrides) so this handler is the
  // only thing reacting to wheel — no two-system fight.
  //
  // CLAMPING: because setLookAt() bypasses the library's min/max
  // distance limits, this handler replicates them itself (see steps
  // 4b / 4c). It clamps both the eye→cursor distance AND, when there
  // is a real surface hit, the eye→surface distance — the latter is
  // the true "don't zoom through the wall" guard for interiors.
  useEffect(() => {
    if (isPreviewMode || isFirstPersonMode) return
    if (cameraModeForZoom === 'orthographic') return // library's ZOOM handles ortho
    const domEl = gl.domElement
    const ndc = new Vector2()
    const cursorPoint = new Vector3()
    const oldEye = new Vector3()
    const oldTarget = new Vector3()
    const newEye = new Vector3()
    const eyeDelta = new Vector3()
    const dirFromAnchor = new Vector3()

    const handleWheel = (event: WheelEvent) => {
      const c = controls.current
      if (!c) return
      event.preventDefault?.()

      // 1. Cursor → NDC → ray.
      const rect = domEl.getBoundingClientRect()
      ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      raycaster.setFromCamera(ndc, camera)

      // 2. World point under cursor: prefer scene hit; fall back to a
      //    point along the ray at the current eye-to-target distance.
      //    The fallback distance is CLAMPED so that a wheel tick over
      //    empty space (when already zoomed far out) can't fling the
      //    camera — the runaway step size was a big part of the
      //    "zooms too much in both directions" problem.
      c.getPosition(oldEye)
      c.getTarget(oldTarget)
      const focusDist = oldEye.distanceTo(oldTarget)
      const hits = raycaster.intersectObject(scene, true)
      const hit = hits.find((h) => h.point && h.distance > 0.001)
      if (hit) {
        cursorPoint.copy(hit.point)
      } else {
        const safeDist = Math.min(Math.max(focusDist, MIN_ZOOM_DIST), MAX_ZOOM_DIST)
        cursorPoint.copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction, safeDist)
      }

      // 3. Zoom factor — multiplicative, so step size scales naturally
      //    with current distance (controllable at both extremes).
      //    deltaY < 0 = wheel up = zoom IN.
      //
      //    deltaMode normalisation: mice send line deltas (chunky),
      //    trackpads send pixel deltas (many small events). Scale the
      //    per-event step by the delta magnitude, clamped, so both
      //    input devices feel consistent instead of a fixed 7% jump
      //    per event (which made trackpad zoom feel coarse).
      const zoomingIn = event.deltaY < 0
      let unit = Math.abs(event.deltaY)
      if (event.deltaMode === 1) {
        unit *= 16 // lines → approx pixels
      } else if (event.deltaMode === 2) {
        unit *= rect.height // pages → approx pixels
      }
      // Map the pixel delta into a gentle step fraction, clamped so a
      // single large event can't jump too far.
      const stepFraction = Math.min(Math.max(unit / 100, 0.04), 0.12)

      // 3b. Adaptive near-surface step: when there is a real surface
      //     under the cursor and the eye is getting close to it,
      //     shrink the step so the final approach is fine-grained —
      //     exactly when "build precisely" matters most.
      let effectiveStep = stepFraction
      if (hit && zoomingIn) {
        const eyeToSurface = oldEye.distanceTo(hit.point)
        // Below ~3x MIN_ZOOM_DIST start easing the step toward a small
        // floor so the last stretch of zoom-in is delicate.
        const closeBand = MIN_ZOOM_DIST * 3
        if (eyeToSurface < closeBand) {
          const t = Math.max(eyeToSurface - MIN_ZOOM_DIST, 0) / (closeBand - MIN_ZOOM_DIST)
          // t = 0 at the surface, 1 at the edge of the band.
          effectiveStep = Math.max(stepFraction * t, 0.015)
        }
      }

      const zoomFactor = zoomingIn ? 1 - effectiveStep : 1 + effectiveStep

      // 4. New eye = cursorPoint + (oldEye - cursorPoint) * factor.
      newEye.copy(oldEye).sub(cursorPoint).multiplyScalar(zoomFactor).add(cursorPoint)

      // 4b. Clamp distance from the anchor (cursor) point. This is the
      //     general replacement for the library's minDistance /
      //     maxDistance, which setLookAt() would otherwise bypass.
      let dist = newEye.distanceTo(cursorPoint)
      if (dist < MIN_ZOOM_DIST || dist > MAX_ZOOM_DIST) {
        const clamped = Math.min(Math.max(dist, MIN_ZOOM_DIST), MAX_ZOOM_DIST)
        dirFromAnchor.copy(newEye).sub(cursorPoint).normalize().multiplyScalar(clamped)
        newEye.copy(cursorPoint).add(dirFromAnchor)
      }

      // 4c. Hard "don't go through the wall" guard. Clamping to the
      //     cursor point isn't enough on its own: the cursor point can
      //     be far away while a wall sits right in front of the eye.
      //     When we have a genuine surface hit, never let the eye get
      //     closer to THAT surface than MIN_ZOOM_DIST.
      if (hit) {
        const eyeToSurface = newEye.distanceTo(hit.point)
        if (eyeToSurface < MIN_ZOOM_DIST) {
          dirFromAnchor.copy(oldEye).sub(hit.point).normalize().multiplyScalar(MIN_ZOOM_DIST)
          newEye.copy(hit.point).add(dirFromAnchor)
        }
      }

      // 5. Translate orbit target by the SAME delta — preserves look
      //    direction (no rotation, no perceived "slide"); cursor's
      //    world point stays under the cursor on screen.
      eyeDelta.copy(newEye).sub(oldEye)
      const newTargetX = oldTarget.x + eyeDelta.x
      const newTargetY = oldTarget.y + eyeDelta.y
      const newTargetZ = oldTarget.z + eyeDelta.z

      // 6. Apply with transition so the move is smoothed (smoothTime
      //    set elsewhere). Library lerps the camera to the new pose.
      c.setLookAt(newEye.x, newEye.y, newEye.z, newTargetX, newTargetY, newTargetZ, true)
    }

    // passive: false so preventDefault works (stops the page from
    // scrolling when the canvas is the wheel target).
    domEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => domEl.removeEventListener('wheel', handleWheel)
  }, [camera, gl, raycaster, scene, isPreviewMode, isFirstPersonMode, cameraModeForZoom])

  useEffect(() => {
    if (isPreviewMode) return // Preview mode uses auto-navigate instead
    let targetY = 0
    if (currentLevelId) {
      const levelMesh = sceneRegistry.nodes.get(currentLevelId)
      if (levelMesh) {
        targetY = levelMesh.position.y
      }
    }
    if (!controls.current) return
    if (firstLoad.current) {
      firstLoad.current = false
      controls.current.setLookAt(20, 20, 20, 0, 0, 0, true)
    }
    controls.current.getTarget(currentTarget)
    controls.current.moveTo(currentTarget.x, targetY, currentTarget.z, true)
  }, [currentLevelId, isPreviewMode])

  useEffect(() => {
    if (!controls.current) return

    controls.current.maxPolarAngle = maxPolarAngle
    controls.current.minPolarAngle = 0

    if (controls.current.polarAngle > maxPolarAngle) {
      controls.current.rotateTo(controls.current.azimuthAngle, maxPolarAngle, true)
    }
  }, [maxPolarAngle])

  // Re-centre the orbit pivot at the start of every rotation gesture.
  // Zoom-to-cursor drifts the orbit target toward the cursor's world
  // hit (necessary to keep the cursor anchored on screen), but if you
  // then rotate, the camera pivots around that drifted point and the
  // whole layout appears to swing/slide. Snapping the target back to
  // whatever's in the centre of the view at rotation-start fixes that
  // — rotation feels like spinning the layout around its centre.
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const ndc = new Vector2(0, 0) // dead-centre of canvas
    const recentrePivot = () => {
      const action = (c as unknown as { currentAction?: number }).currentAction
      // ROTATE = 1 and TOUCH_ROTATE = 64 in the library's action bitmask;
      // composite actions like TOUCH_ZOOM_ROTATE OR these in, so a bitwise
      // check catches all rotate-involving gestures.
      const ROTATE_MASK =
        CameraControlsImpl.ACTION.ROTATE | CameraControlsImpl.ACTION.TOUCH_ROTATE
      if (action === undefined || (action & ROTATE_MASK) === 0) return
      raycaster.setFromCamera(ndc, camera)
      const hits = raycaster.intersectObject(scene, true)
      const hit = hits.find((h) => h.point && h.distance > 0.001)
      if (hit) {
        c.setTarget(hit.point.x, hit.point.y, hit.point.z, false)
      } else {
        // No geometry in the centre → fall back to the intersection
        // with the current level's ground plane (y = level height),
        // which keeps rotation feeling grounded for floor-plan work
        // instead of pivoting around an arbitrary point in mid-air.
        c.getPosition(tempPosition)
        c.getTarget(tempTarget)
        const ray = raycaster.ray
        let planeY = 0
        if (currentLevelId) {
          const levelMesh = sceneRegistry.nodes.get(currentLevelId)
          if (levelMesh) {
            planeY = levelMesh.position.y
          }
        }
        // Intersect the centre ray with the horizontal plane at planeY.
        // Guard against a near-parallel ray (no usable intersection):
        // fall back to a point at the current focus distance.
        if (Math.abs(ray.direction.y) > 1e-4) {
          const t = (planeY - ray.origin.y) / ray.direction.y
          if (t > 0) {
            c.setTarget(
              ray.origin.x + ray.direction.x * t,
              planeY,
              ray.origin.z + ray.direction.z * t,
              false,
            )
            return
          }
        }
        const focusDist = tempPosition.distanceTo(tempTarget)
        c.setTarget(
          ray.origin.x + ray.direction.x * focusDist,
          ray.origin.y + ray.direction.y * focusDist,
          ray.origin.z + ray.direction.z * focusDist,
          false,
        )
      }
    }
    c.addEventListener('controlstart', recentrePivot)
    return () => c.removeEventListener('controlstart', recentrePivot)
  }, [camera, raycaster, scene, currentLevelId])

  // Snappy feel — defaults in yomotsu/camera-controls are tuned for
  // cinematic ease which reads as lag in an editing context. Shorter
  // smoothing keeps the wheel zoom responsive. dollyToCursor is left
  // OFF for perspective because our custom wheel handler owns that
  // mode entirely; for orthographic it is turned ON in the camera-mode
  // effect below so the library's ZOOM action anchors on the cursor
  // (perspective vs ortho need opposite settings, so it is set per
  // mode rather than once here).
  useEffect(() => {
    const c = controls.current
    if (!c) return
    c.smoothTime = 0.12
    c.draggingSmoothTime = 0.04
    c.dollySpeed = 1.6
    c.truckSpeed = 2.5
    c.azimuthRotateSpeed = 1.2
    c.polarRotateSpeed = 1.2
  }, [])

  // dollyToCursor must follow the camera mode:
  //  - perspective: OFF — the custom wheel handler does zoom-to-cursor,
  //    and leaving dollyToCursor on would let the library fight it.
  //  - orthographic: ON — wheel = ACTION.ZOOM is owned by the library
  //    in 2D, and dollyToCursor is what makes that ZOOM anchor on the
  //    cursor instead of the viewport centre. With it OFF, ortho zoom
  //    snaps to centre — the exact original complaint, just in 2D.
  useEffect(() => {
    const c = controls.current
    if (!c) return
    c.dollyToCursor = cameraModeForZoom === 'orthographic'
  }, [cameraModeForZoom])

  const focusNode = useCallback(
    (nodeId: string) => {
      if (isPreviewMode || !controls.current) return

      const object3D = sceneRegistry.nodes.get(nodeId)
      if (!object3D) return

      tempBox.setFromObject(object3D)
      if (tempBox.isEmpty()) return

      tempBox.getCenter(tempCenter)
      controls.current.getPosition(tempPosition)
      controls.current.getTarget(tempTarget)
      tempDelta.copy(tempCenter).sub(tempTarget)

      controls.current.setLookAt(
        tempPosition.x + tempDelta.x,
        tempPosition.y + tempDelta.y,
        tempPosition.z + tempDelta.z,
        tempCenter.x,
        tempCenter.y,
        tempCenter.z,
        true,
      )
    },
    [isPreviewMode],
  )

  // Configure mouse buttons based on control mode and camera mode.
  //
  // Wheel is set to NONE for perspective because our custom wheel
  // handler (further up) does the proper zoom-toward-cursor. Ortho
  // mode keeps the library's ZOOM which scales the viewport with the
  // cursor as anchor (dollyToCursor is enabled for ortho) — already
  // correct in 2D.
  const cameraMode = useViewer((state) => state.cameraMode)
  const mouseButtons = useMemo(() => {
    const wheelAction =
      cameraMode === 'orthographic'
        ? CameraControlsImpl.ACTION.ZOOM
        : CameraControlsImpl.ACTION.NONE

    return {
      left: isPreviewMode ? CameraControlsImpl.ACTION.SCREEN_PAN : CameraControlsImpl.ACTION.NONE,
      middle: CameraControlsImpl.ACTION.SCREEN_PAN,
      right: CameraControlsImpl.ACTION.ROTATE,
      wheel: wheelAction,
    }
  }, [cameraMode, isPreviewMode])

  // Touch gestures (mobile / trackpad).
  // - One finger drag    → rotate by default (much easier on a phone), but
  //                        falls back to NONE while the user is actively
  //                        placing/moving something OR in box-select mode,
  //                        so the editor's pointer handlers (place tool,
  //                        drag-to-move endpoint, marquee selection drag)
  //                        keep priority over the camera.
  //                        In preview mode it's TOUCH_TRUCK (pan), matching
  //                        preview's left = SCREEN_PAN.
  // - Two finger pinch   → zoom + pan together (TOUCH_DOLLY_TRUCK for
  //                        perspective, TOUCH_ZOOM_TRUCK for orthographic).
  // - Three finger drag  → rotate, so the camera is always orbitable even
  //                        when one-finger is suppressed by an active
  //                        editor action.
  const tool = useEditor((s) => s.tool)
  const mode = useEditor((s) => s.mode)
  const selectionTool = useEditor((s) => s.floorplanSelectionTool)
  const movingNode = useEditor((s) => s.movingNode)
  const movingWallEndpoint = useEditor((s) => s.movingWallEndpoint)
  const movingFenceEndpoint = useEditor((s) => s.movingFenceEndpoint)
  const isBoxSelectActive = mode === 'select' && selectionTool === 'marquee'
  const isInteracting = Boolean(
    tool || movingNode || movingWallEndpoint || movingFenceEndpoint || isBoxSelectActive,
  )
  const touches = useMemo(() => {
    const twoFingerAction =
      cameraMode === 'orthographic'
        ? CameraControlsImpl.ACTION.TOUCH_ZOOM_TRUCK
        : CameraControlsImpl.ACTION.TOUCH_DOLLY_TRUCK

    const oneFingerAction = isPreviewMode
      ? CameraControlsImpl.ACTION.TOUCH_TRUCK
      : isInteracting
        ? CameraControlsImpl.ACTION.NONE
        : CameraControlsImpl.ACTION.TOUCH_ROTATE

    return {
      one: oneFingerAction,
      two: twoFingerAction,
      three: CameraControlsImpl.ACTION.TOUCH_ROTATE,
    }
  }, [cameraMode, isPreviewMode, isInteracting])

  useEffect(() => {
    const keyState = {
      shiftRight: false,
      shiftLeft: false,
      controlRight: false,
      controlLeft: false,
      space: false,
    }

    const updateConfig = () => {
      if (!controls.current) return

      const shift = keyState.shiftRight || keyState.shiftLeft
      const control = keyState.controlRight || keyState.controlLeft
      const space = keyState.space

      // NONE for perspective — our custom wheel handler owns it (see
      // zoom-toward-cursor useEffect at top of file). ZOOM for ortho.
      const wheelAction =
        cameraMode === 'orthographic'
          ? CameraControlsImpl.ACTION.ZOOM
          : CameraControlsImpl.ACTION.NONE
      controls.current.mouseButtons.wheel = wheelAction
      controls.current.mouseButtons.middle = CameraControlsImpl.ACTION.SCREEN_PAN
      controls.current.mouseButtons.right = CameraControlsImpl.ACTION.ROTATE
      if (isPreviewMode) {
        // In preview mode, left-click is always pan (viewer-style)
        controls.current.mouseButtons.left = CameraControlsImpl.ACTION.SCREEN_PAN
      } else if (space) {
        controls.current.mouseButtons.left = CameraControlsImpl.ACTION.SCREEN_PAN
      } else {
        controls.current.mouseButtons.left = CameraControlsImpl.ACTION.NONE
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        keyState.space = true
        document.body.style.cursor = 'grab'
      }
      if (event.code === 'ShiftRight') {
        keyState.shiftRight = true
      }
      if (event.code === 'ShiftLeft') {
        keyState.shiftLeft = true
      }
      if (event.code === 'ControlRight') {
        keyState.controlRight = true
      }
      if (event.code === 'ControlLeft') {
        keyState.controlLeft = true
      }
      updateConfig()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        keyState.space = false
        document.body.style.cursor = ''
      }
      if (event.code === 'ShiftRight') {
        keyState.shiftRight = false
      }
      if (event.code === 'ShiftLeft') {
        keyState.shiftLeft = false
      }
      if (event.code === 'ControlRight') {
        keyState.controlRight = false
      }
      if (event.code === 'ControlLeft') {
        keyState.controlLeft = false
      }
      updateConfig()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    updateConfig()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [cameraMode, isPreviewMode])

  // Preview mode: auto-navigate camera to selected node (viewer behavior)
  const previewTargetNodeId = isPreviewMode
    ? (selection.zoneId ?? selection.levelId ?? selection.buildingId)
    : null

  useEffect(() => {
    if (!(isPreviewMode && controls.current)) return

    const nodes = useScene.getState().nodes
    let node = previewTargetNodeId ? nodes[previewTargetNodeId] : null

    if (!previewTargetNodeId) {
      const site = Object.values(nodes).find((n) => n.type === 'site')
      node = site || null
    }
    if (!node) return

    // Check if node has a saved camera
    if (node.camera) {
      const { position, target } = node.camera
      if (
        position &&
        target &&
        position.length >= 3 &&
        target.length >= 3 &&
        position.every((v) => v !== null && v !== undefined) &&
        target.every((v) => v !== null && v !== undefined)
      ) {
        requestAnimationFrame(() => {
          if (!controls.current) return
          controls.current.setLookAt(
            position[0],
            position[1],
            position[2],
            target[0],
            target[1],
            target[2],
            true,
          )
        })
      }
      return
    }

    if (!previewTargetNodeId) return

    // Calculate camera position from bounding box
    const object3D = sceneRegistry.nodes.get(previewTargetNodeId)
    if (!object3D) return

    tempBox.setFromObject(object3D)
    tempBox.getCenter(tempCenter)
    tempBox.getSize(tempSize)

    const maxDim = Math.max(tempSize.x, tempSize.y, tempSize.z)
    const distance = Math.max(maxDim * 2, 15)

    controls.current.setLookAt(
      tempCenter.x + distance * 0.7,
      tempCenter.y + distance * 0.5,
      tempCenter.z + distance * 0.7,
      tempCenter.x,
      tempCenter.y,
      tempCenter.z,
      true,
    )
  }, [isPreviewMode, previewTargetNodeId])

  useEffect(() => {
    const handleNodeCapture = ({ nodeId }: CameraControlEvent) => {
      if (!controls.current) return

      const position = new Vector3()
      const target = new Vector3()
      controls.current.getPosition(position)
      controls.current.getTarget(target)

      const state = useScene.getState()

      state.updateNode(nodeId, {
        camera: {
          position: [position.x, position.y, position.z],
          target: [target.x, target.y, target.z],
          mode: useViewer.getState().cameraMode,
        },
      })
    }
    const handleNodeView = ({ nodeId }: CameraControlEvent) => {
      if (!controls.current) return

      const node = useScene.getState().nodes[nodeId]
      if (!node?.camera) return
      const { position, target } = node.camera

      controls.current.setLookAt(
        position[0],
        position[1],
        position[2],
        target[0],
        target[1],
        target[2],
        true,
      )
    }

    const handleTopView = () => {
      if (!controls.current) return

      const currentPolarAngle = controls.current.polarAngle

      // Toggle: if already near top view (< 0.1 radians ≈ 5.7°), go back to 45°
      // Otherwise, go to top view (0°)
      const targetAngle = currentPolarAngle < 0.1 ? Math.PI / 4 : 0

      controls.current.rotatePolarTo(targetAngle, true)
    }

    const handleOrbitCW = () => {
      if (!controls.current) return

      const currentAzimuth = controls.current.azimuthAngle
      const currentPolar = controls.current.polarAngle
      // Round to nearest 90° increment, then rotate 90° clockwise
      const rounded = Math.round(currentAzimuth / (Math.PI / 2)) * (Math.PI / 2)
      const target = rounded - Math.PI / 2

      controls.current.rotateTo(target, currentPolar, true)
    }

    const handleOrbitCCW = () => {
      if (!controls.current) return

      const currentAzimuth = controls.current.azimuthAngle
      const currentPolar = controls.current.polarAngle
      // Round to nearest 90° increment, then rotate 90° counter-clockwise
      const rounded = Math.round(currentAzimuth / (Math.PI / 2)) * (Math.PI / 2)
      const target = rounded + Math.PI / 2

      controls.current.rotateTo(target, currentPolar, true)
    }

    const handleNodeFocus = ({ nodeId }: CameraControlEvent) => {
      focusNode(nodeId)
    }

    const handleFitScene = ({ bounds }: CameraControlFitSceneEvent) => {
      if (!controls.current || isPreviewMode) return
      if (!bounds) {
        // Restore default framing pose when no bounds were computed.
        controls.current.setLookAt(20, 20, 20, 0, 0, 0, true)
        return
      }
      const [cx, cz] = bounds.center
      const [w, d] = bounds.size
      // Use the longer horizontal extent to size the orbit radius so the whole
      // footprint sits in view regardless of aspect ratio.
      const maxExtent = Math.max(w, d)
      const distance = Math.max(maxExtent * 1.4, 15)
      const height = Math.max(maxExtent * 0.8, 10)
      controls.current.setLookAt(cx + distance * 0.7, height, cz + distance * 0.7, cx, 0, cz, true)
    }

    emitter.on('camera-controls:capture', handleNodeCapture)
    emitter.on('camera-controls:focus', handleNodeFocus)
    emitter.on('camera-controls:view', handleNodeView)
    emitter.on('camera-controls:top-view', handleTopView)
    emitter.on('camera-controls:orbit-cw', handleOrbitCW)
    emitter.on('camera-controls:orbit-ccw', handleOrbitCCW)
    emitter.on('camera-controls:fit-scene', handleFitScene)

    return () => {
      emitter.off('camera-controls:capture', handleNodeCapture)
      emitter.off('camera-controls:focus', handleNodeFocus)
      emitter.off('camera-controls:view', handleNodeView)
      emitter.off('camera-controls:top-view', handleTopView)
      emitter.off('camera-controls:orbit-cw', handleOrbitCW)
      emitter.off('camera-controls:orbit-ccw', handleOrbitCCW)
      emitter.off('camera-controls:fit-scene', handleFitScene)
    }
  }, [focusNode, isPreviewMode])

  const onTransitionStart = useCallback(() => {
    useViewer.getState().setCameraDragging(true)
  }, [])

  const onRest = useCallback(() => {
    useViewer.getState().setCameraDragging(false)
  }, [])

  if (isFirstPersonMode) {
    return null
  }

  return (
    <CameraControls
      makeDefault
      maxDistance={MAX_ZOOM_DIST}
      maxPolarAngle={maxPolarAngle}
      minDistance={MIN_ZOOM_DIST}
      minPolarAngle={0}
      mouseButtons={mouseButtons}
      onRest={onRest}
      onSleep={onRest}
      onTransitionStart={onTransitionStart}
      ref={controls}
      restThreshold={0.01}
      touches={touches}
    />
  )
}