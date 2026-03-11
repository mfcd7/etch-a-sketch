const container = document.getElementById("board");
const colorPicker = document.getElementById("colorPicker");
const sizeSlider = document.getElementById("sizeSlider");
const sizeValue = document.getElementById("sizeValue");
const sizeValue2 = document.getElementById("sizeValue2");
const clearBtn = document.getElementById("clearBtn");

const toolBtns = document.querySelectorAll('.tool-btn');

let currentMode = 'pen'; // 'pen', 'pencil', 'eraser', 'fill'
let currentColor = '#000000';
let currentSize = 16;
let isDrawing = false; // To handle drag to draw

// Setup Events Global Listeners
document.body.addEventListener('mousedown', () => isDrawing = true);
document.body.addEventListener('mouseup', () => isDrawing = false);
// Make sure drag doesn't break our drawing
document.body.addEventListener('dragstart', (e) => e.preventDefault());

// Tool Events
colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
});

toolBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Toggle Active Class
        toolBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Set Mode
        currentMode = e.currentTarget.dataset.tool;
    });
});

sizeSlider.addEventListener('input', (e) => {
    currentSize = parseInt(e.target.value);
    sizeValue.textContent = currentSize;
    sizeValue2.textContent = currentSize;
    generateSquares(currentSize);
});

clearBtn.addEventListener('click', () => {
    generateSquares(currentSize);
});

// Hex to RGB string for proper comparison
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
    }
    return null;
}

// Convert rgb() string to an array [r,g,b]
function rgbStringToArray(rgbString) {
    if (!rgbString || rgbString === 'rgba(0, 0, 0, 0)') return [255, 255, 255]; // default transparent to whiteish representation for logic
    const match = rgbString.match(/^rgb\(?(\d+),\s*(\d+),\s*(\d+)\)?$/);
    return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [255, 255, 255];
}


// Grid Generation
function generateSquares(size) {
    container.innerHTML = "";

    // Set up css grid
    container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    for (let i = 0; i < size * size; i++) {
        const myDiv = document.createElement("div");
        myDiv.classList.add("grid");
        myDiv.dataset.index = i;

        // Setup individual interactions
        myDiv.addEventListener('mousedown', (e) => applyTool(e.target));
        myDiv.addEventListener('mouseover', (e) => {
            if (isDrawing) applyTool(e.target);
        });

        container.appendChild(myDiv);
    }
}

// Draw logic
function applyTool(cell) {
    // Fill requires just one click, ignore hover dragging
    if (currentMode === 'fill' && isDrawing) {
        floodFill(cell);
        return;
    }

    if (currentMode === 'pen') {
        cell.style.backgroundColor = currentColor;
        cell.dataset.passes = ''; // reset pencil passes if overwritten
    }
    else if (currentMode === 'eraser') {
        cell.style.backgroundColor = '';
        cell.dataset.passes = '';
    }
    else if (currentMode === 'pencil') {
        let passes = parseInt(cell.dataset.passes || 0);
        if (passes < 10 && cell.style.backgroundColor !== currentColor) {
            // Apply pencil using basic black opacity over a white grid
            passes++;
            cell.dataset.passes = passes;

            // To make "pencil" generic with any color, we can use RGBA
            // Convert current hex to RGB values
            const r = parseInt(currentColor.slice(1, 3), 16);
            const g = parseInt(currentColor.slice(3, 5), 16);
            const b = parseInt(currentColor.slice(5, 7), 16);

            cell.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${passes * 0.1})`;
        }
    }
}

// Flood Fill Logic (BFS)
function floodFill(startCell) {
    // Determine target color in RGB to compare easily
    // We normalize empty strings or 'rgba(0, 0, 0, 0)' to transparent
    let targetColor = startCell.style.backgroundColor;
    if (!targetColor || targetColor === 'rgba(0, 0, 0, 0)' || targetColor === 'transparent') {
        targetColor = '';
    }

    const replacementColorRGB = hexToRgb(currentColor);

    // If clicking on same color, do nothing
    // Need to handle if both are empty/transparent, or if they are the same RGB string
    if (targetColor === replacementColorRGB) return;
    if (targetColor === '' && replacementColorRGB === 'rgb(0, 0, 0)' && currentColor === '#000000') {
        // if we are painting black over empty space, let it proceed
    } else if (targetColor === replacementColorRGB || (!targetColor && currentColor === '')) {
        return;
    }

    const size = currentSize;
    const startIndex = parseInt(startCell.dataset.index);
    const cells = Array.from(container.children);

    // Using BFS
    const queue = [startIndex];
    const visited = new Set([startIndex]);

    while (queue.length > 0) {
        const currentIdx = queue.shift();
        const cell = cells[currentIdx];

        // Update color immediately
        cell.style.backgroundColor = currentColor;
        cell.dataset.passes = ''; // reset pencil history

        // Calculate surrounding indices
        const x = currentIdx % size;
        const y = Math.floor(currentIdx / size);

        const neighbors = [];
        if (y > 0) neighbors.push(currentIdx - size); // top
        if (y < size - 1) neighbors.push(currentIdx + size); // bottom
        if (x > 0) neighbors.push(currentIdx - 1); // left
        if (x < size - 1) neighbors.push(currentIdx + 1); // right

        for (const nIdx of neighbors) {
            if (!visited.has(nIdx)) {
                const nCell = cells[nIdx];
                let nColor = nCell.style.backgroundColor;
                if (!nColor || nColor === 'rgba(0, 0, 0, 0)' || nColor === 'transparent') {
                    nColor = '';
                }

                // If it matches original target color EXACTLY
                if (nColor === targetColor) {
                    visited.add(nIdx);
                    queue.push(nIdx);
                }
            }
        }
    }
}

// Init
generateSquares(currentSize);