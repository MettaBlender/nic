const toRelativePosition = (x, y, containerWidth, containerHeight) => ({
    x: (x / containerWidth) * 100,
    y: (y / containerHeight) * 100
})

export default toRelativePosition
