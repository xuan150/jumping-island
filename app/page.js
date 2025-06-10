'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 500
const PLAYER_DIE_THRESHOLD = CANVAS_HEIGHT - 150

export default function IslandHoppingGame() {
  const canvasRef = useRef(null)
  const playerImageRef = useRef(null)
  const [isRunning, setIsRunning] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const islandImageRef = useRef(null) //new
  const [islandImageLoaded, setIslandImageLoaded] = useState(false) //new

  // Constants
  const playerHeight = 60
  const playerWidth = 40
  const gravity = 0.6
  const jumpPower = 12
  const groundY = 200 // Y-coordinate for the top surface of islands
  const worldSpeed = 3
  // let gameAreaHeight = 300
  const gameAreaHeight = CANVAS_HEIGHT

  // Use refs for mutable game state to avoid re-renders and dependency issues
  const playerRef = useRef({
    x: 50,
    y: groundY - playerHeight,
    vy: 0,
    jumping: false,
  })
  const islandsRef = useRef([
    { x: 0, width: 120 },
    { x: 200, width: 100 },
    { x: 380, width: 110 },
  ])

  useEffect(() => {
    const image = new Image()
    image.onload = () => {
      playerImageRef.current = image
      setImageLoaded(true)
    }
    image.onerror = () => {
      console.error('Failed to load player.jpg')
      setImageLoaded(false)
    }
    image.src = '/player.png' // Image should be in public folder
    // image.src =
    //   'https://cdn.gamedevmarket.net/wp-content/uploads/20201214045903/9d8fa97f717b9f253324e88c39c99434.gif'

    //new
    // Load island image (new image loading)
    const islandImage = new Image()
    islandImage.onload = () => {
      islandImageRef.current = islandImage
      setIslandImageLoaded(true)
    }
    islandImage.onerror = () => {
      console.error('Failed to load island.png')
      setIslandImageLoaded(false)
    }
    islandImage.src = '/island.png' // Add island image to public folder
    //newend
  }, [])

  const checkCollision = useCallback(() => {
    const player = playerRef.current
    let isOnIsland = false

    // Check if player has landed on any island
    islandsRef.current.forEach((island) => {
      if (
        player.x + playerWidth > island.x && // Player's right edge is past island's left edge
        player.x < island.x + island.width && // Player's left edge is before island's right edge
        player.y + playerHeight >= groundY && // Player's bottom is at or below the island surface
        player.vy <= 0 // Player is moving downwards
      ) {
        // Snap player to the top of the island
        player.y = groundY - playerHeight // Fix: Position player's bottom on the island's surface
        player.vy = 0
        player.jumping = false
        isOnIsland = true
      }
    })

    // Check if player fell off the screen
    if (player.y + PLAYER_DIE_THRESHOLD > gameAreaHeight) {
      setGameOver(true)
      setIsRunning(false)
    }

    return isOnIsland
  }, [gameAreaHeight])

  const updatePlayer = useCallback(() => {
    const player = playerRef.current

    // Apply gravity
    player.vy -= gravity
    player.y -= player.vy

    const isOnIsland = checkCollision()

    // If not on an island and is at or below ground level, player is jumping/falling
    if (!isOnIsland && player.y + playerHeight < gameAreaHeight) {
      player.jumping = true
    }
  }, [checkCollision, gameAreaHeight])

  const updateWorld = useCallback(() => {
    // Move islands to the left
    islandsRef.current = islandsRef.current.map((island) => ({
      ...island,
      x: island.x - worldSpeed,
    }))

    // Remove islands that are off-screen
    islandsRef.current = islandsRef.current.filter(
      (island) => island.x + island.width > 0
    )

    // Generate new islands to maintain a continuous path
    const lastIsland = islandsRef.current[islandsRef.current.length - 1]
    if (lastIsland && lastIsland.x < CANVAS_WIDTH) {
      const gap = 110 + Math.random() * 15 // Fix: Reduced gap size to 40-80 pixels
      const width = 80 + Math.random() * 60 // Random width for variety
      islandsRef.current.push({
        x: lastIsland.x + lastIsland.width + gap,
        width: width,
      })
    }

    // Increment score
    setScore((prev) => prev + 1)
  }, [])

  const jump = useCallback(() => {
    const player = playerRef.current
    if (isRunning && !player.jumping) {
      player.vy = jumpPower
      player.jumping = true
    }
  }, [isRunning])

  const startGame = useCallback(() => {
    setGameOver(false)
    setScore(0)
    playerRef.current = {
      x: 50,
      y: groundY - playerHeight,
      vy: 0,
      jumping: false,
    }
    islandsRef.current = [
      { x: 0, width: 120 },
      { x: 200, width: 100 },
      { x: 380, width: 110 },
    ]
    setIsRunning(true)
  }, [])

  // Main game loop effect
  useEffect(() => {
    if (!isRunning || !imageLoaded) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationFrameId

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw background
      // ctx.fillStyle = '#87CEEB' // Sky blue
      // ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw islands
      // ctx.fillStyle = '#228B22' // Forest green
      // islandsRef.current.forEach((island) => {
      //   ctx.fillRect(island.x, groundY, island.width, 100) // Draw islands downwards from groundY
      // })

      //new
      // Draw islands with image
      islandsRef.current.forEach((island) => {
        if (islandImageRef.current && islandImageLoaded) {
          // Draw island image stretched to island width
          ctx.drawImage(
            islandImageRef.current,
            island.x,
            groundY,
            island.width,
            100 // Match original island height
          )
        } else {
          // Fallback to green rectangle
          ctx.fillStyle = '#228B22'
          ctx.fillRect(island.x, groundY, island.width, 100)
        }
      })
      //newend

      // Draw player image
      const player = playerRef.current
      if (playerImageRef.current && imageLoaded) {
        ctx.drawImage(
          playerImageRef.current,
          player.x,
          player.y,
          playerWidth,
          playerHeight
        )
      } else {
        // Fallback to rectangle if image not loaded
        ctx.fillStyle = '#FF4500' // Orange-red
        ctx.fillRect(player.x, player.y, playerWidth, playerHeight)
      }
    }

    const gameLoop = () => {
      if (!isRunning) return

      updatePlayer()
      updateWorld()
      draw()

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    animationFrameId = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isRunning, imageLoaded, islandImageLoaded, updatePlayer, updateWorld])

  // Keyboard controls effect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault()
        jump()
      } else if ((e.key === 's' || e.key === 'S') && !isRunning && !gameOver) {
        startGame()
      } else if ((e.key === 'r' || e.key === 'R') && gameOver) {
        startGame()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, gameOver, jump, startGame])

  return (
    <div className="w-screen h-screen flex flex-col items-center font-sans">
      <div className="w-full grow bg-[url(/background.png)] grid grid-cols-4">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-2">Island Hopper</h1>
          <p className="text-lg">Score: {score}</p>
          {!imageLoaded && (
            <p className="text-sm text-yellow-600">Loading player image...</p>
          )}
        </div>
        <div className="window-frame col-span-2 w-full h-full flex flex-col items-center justify-center">
          <div className="w-full">
            {!isRunning && !gameOver && imageLoaded && (
              <p className="text-md text-gray-600">
                Press &apos;S&apos; to Start
              </p>
            )}
            {isRunning && (
              <p className="text-md text-gray-600">Press SPACE or ↑ to Jump</p>
            )}
            {gameOver && (
              <p className="text-md text-gray-600">
                Press &apos;R&apos; to Restart
              </p>
            )}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl text-red-600 bg-white/30 rounded-md p-4 backdrop-blur-2xl font-bold">
                  Game Over!
                </p>
              </div>
            )}
          </div>
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="border-2 rounded-md shadow-lg"
          />
        </div>
        <div></div>
      </div>
    </div>
  )
}
