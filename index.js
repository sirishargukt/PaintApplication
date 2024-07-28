const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let erasing = false;
let currentColor = 'black';
let pencilSize = 3;
let lastX, lastY;

let undoStack = [];
let redoStack = [];

function resizeCanvas() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.putImageData(imageData, 0, 0);
}

window.addEventListener('load', () => {
    resizeCanvas();
    loadCanvasState();
});
window.addEventListener('resize', resizeCanvas);

function saveState() {
    undoStack.push(canvas.toDataURL());
    redoStack = [];
    saveCanvasState();
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = erasing ? 'white' : currentColor;
    ctx.lineWidth = pencilSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    [lastX, lastY] = [x, y];
}

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    [lastX, lastY] = [(e.clientX - rect.left) * (canvas.width / rect.width), (e.clientY - rect.top) * (canvas.height / rect.height)];
    saveState();
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
    saveCanvasState();
}

function clearCanvas() {
    saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
}

function undo() {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        const img = new Image();
        img.src = undoStack[undoStack.length - 1];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            saveCanvasState();
        };
    }
}

function redo() {
    if (redoStack.length > 0) {
        const img = new Image();
        img.src = redoStack.pop();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            undoStack.push(img.src);
            saveCanvasState();
        };
    }
}

async function saveCanvasImage() {
    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    const handle = await window.showSaveFilePicker({
        types: [{ description: 'PNG Files', accept: { 'image/png': ['.png'] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
}

function saveCanvasState() {
    localStorage.setItem('canvasImage', canvas.toDataURL());
    localStorage.setItem('undoStack', JSON.stringify(undoStack));
    localStorage.setItem('redoStack', JSON.stringify(redoStack));
    localStorage.setItem('currentColor', currentColor);
    localStorage.setItem('pencilSize', pencilSize);
    localStorage.setItem('erasing', erasing);
}

function loadCanvasState() {
    const imageData = localStorage.getItem('canvasImage');
    const savedUndoStack = localStorage.getItem('undoStack');
    const savedRedoStack = localStorage.getItem('redoStack');
    const savedColor = localStorage.getItem('currentColor');
    const savedPencilSize = localStorage.getItem('pencilSize');
    const savedErasing = localStorage.getItem('erasing');

    if (imageData) {
        const img = new Image();
        img.src = imageData;
        img.onload = () => ctx.drawImage(img, 0, 0);
    }
    if (savedUndoStack) {
        undoStack = JSON.parse(savedUndoStack);
    }
    if (savedRedoStack) {
        redoStack = JSON.parse(savedRedoStack);
    }
    if (savedColor) {
        currentColor = savedColor;
    }
    if (savedPencilSize) {
        pencilSize = parseInt(savedPencilSize, 10);
    }
    if (savedErasing !== null) {
        erasing = JSON.parse(savedErasing);
    }
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

document.getElementById('pencilButton').addEventListener('click', () => {
    canvas.style.cursor = 'crosshair';
    erasing = false;
    saveCanvasState();
});

document.getElementById('eraserButton').addEventListener('click', () => {
    erasing = true;
    canvas.style.cursor = 'default';
    saveCanvasState();
});

document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
        currentColor = swatch.style.backgroundColor;
        erasing = false;
        canvas.style.cursor = 'crosshair';
        saveCanvasState();
    });
});

document.getElementById('undoButton').addEventListener('click', undo);
document.getElementById('redoButton').addEventListener('click', redo);
document.getElementById('clearButton').addEventListener('click', clearCanvas);

document.getElementById('fileButton').addEventListener('click', () => {
    document.getElementById('saveButton').style.display = 'block';
});
document.getElementById('saveButton').addEventListener('click', saveCanvasImage);

['line1', 'line2', 'line3', 'line4'].forEach((id, index) => {
    document.getElementById(id).addEventListener('click', () => {
        pencilSize = [2, 5, 8, 12][index];
        saveCanvasState();
    });
});

canvas.addEventListener('touchstart', handleStart);
canvas.addEventListener('touchmove', handleMove);
canvas.addEventListener('touchend', handleEnd);

function handleStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing(touch);
}

function handleMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    draw(touch);
}









function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    // Redraw canvas content if necessary
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Call on initial load

function handleEnd(e) {
    e.preventDefault();
    stopDrawing();
}
