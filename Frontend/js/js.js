// js.js

// --- НАСТРОЙКА БЭКЕНДА ---
const BACKEND_URL = "http://127.0.0.1:8000"; 

// --- ПЕРЕМЕННЫЕ ИНТЕРФЕЙСА ---
const sizeInput = document.getElementById('array-size');
const sizeVal = document.getElementById('size-val');
const speedInput = document.getElementById('speed');
const fillMode = document.getElementById('fill-mode');
const manualInputBox = document.getElementById('manual-input-box');
const sizeControlBox = document.getElementById('size-control-box');
const generateBtn = document.getElementById('generate-btn');
const startBtn = document.getElementById('start-btn');
const nextStepBtn = document.getElementById('next-step-btn');
const stepModeCheck = document.getElementById('step-mode');

const toggleBtn = document.getElementById('toggle-split');
const wrapper = document.getElementById('vis-container2');
const panel2 = document.getElementById('panel-2');
const settings2 = document.getElementById('settings-view-2');

const algoSelect = document.getElementById('algo-select');
const algoSelect2 = document.getElementById('algo-select-2');
const complexityDisplay = document.getElementById('complexity-display');
const complexityDisplay2 = document.getElementById('complexity-display-2');

const customFileBox = document.getElementById('custom-file-box');
const algoFileInput = document.getElementById('algo-file-input');
const fileLabel = document.getElementById('file-label');

const manualInput = document.getElementById('manual-input');

// --- СОСТОЯНИЕ ПРИЛОЖЕНИЯ ---
let algoData = {};
let stepResolver1 = null;
let stepResolver2 = null;
let sharedBaseArray = []; 

// Глобальная переменная для хранения ссылки на выбранный файл
let selectedFileObject = null;

const state1 = {
    id: 's1',
    array: [],
    frames: [],
    currentFrameIndex: 0,
    isSorting: false,
    comparisons: 0,
    swaps: 0,
    domElements: [],
    getAlgoKey: () => algoSelect ? algoSelect.value : 'bubble_sort', 
    stats: {
        comp: document.querySelectorAll('.stats-bar .stat-item span')[1] || null,
        swap: document.querySelectorAll('.stats-bar .stat-item span')[2] || null,
        status: document.querySelectorAll('.stats-bar .stat-item span')[3] || null
    }
};

const state2 = {
    id: 's2',
    array: [],
    frames: [],
    currentFrameIndex: 0,
    isSorting: false,
    comparisons: 0,
    swaps: 0,
    domElements: [],
    customFile: null, 
    getAlgoKey: () => algoSelect2 ? algoSelect2.value : 'bubble_sort',
    stats: {
        comp: null,
        swap: null,
        status: null
    }
};

function initSecondWindowStats() {
    state2.stats.comp = document.getElementById('comparisons-display');
    state2.stats.swap = document.getElementById('swaps-display');
    state2.stats.status = document.getElementById('status-display');
}

// --- ИНИЦИАЛИЗАЦИЯ И ИНТЕГРАЦИЯ ---

async function loadAlgoConfig() {
    console.log("Загрузка конфигурации алгоритмов...");
    try {
        const response = await fetch('sort.json');
        if (!response.ok) throw new Error("Файл sort.json не найден сервером");
        algoData = await response.json();
        console.log("Конфигурация успешно загружена:", algoData);
        
        if (algoSelect) algoSelect.innerHTML = '';
        if (algoSelect2) algoSelect2.innerHTML = '';
        
        Object.keys(algoData).forEach(key => {
            if (algoSelect) {
                const opt1 = document.createElement('option');
                opt1.value = key;
                opt1.innerText = algoData[key].name;
                algoSelect.appendChild(opt1);
            }
            if (algoSelect2) {
                const opt2 = document.createElement('option');
                opt2.value = key;
                opt2.innerText = algoData[key].name;
                algoSelect2.appendChild(opt2);
            }
        });

        if (algoSelect2) {
            const customOpt = document.createElement('option');
            customOpt.value = 'custom';
            customOpt.innerText = '✨ Пользовательская сортировка';
            algoSelect2.appendChild(customOpt);
        }

        updateAlgoInfo(state1, algoSelect, complexityDisplay);
        updateAlgoInfo(state2, algoSelect2, complexityDisplay2);
    } catch (e) {
        console.error("Критическая ошибка в loadAlgoConfig:", e.message);
    }
}

function updateAlgoInfo(state, selectEl, displayEl) {
    if (!selectEl) return;
    const algoKey = selectEl.value;
    
    if (algoKey === 'custom') {
        if (displayEl) displayEl.innerText = 'Зависит от кода';
        if (state.id === 's2' && customFileBox) customFileBox.style.display = 'flex'; 
        return;
    }
    if (state.id === 's2' && customFileBox) customFileBox.style.display = 'none'; 

    if (algoData[algoKey] && displayEl) {
        displayEl.innerText = algoData[algoKey].complexity;
    }
}

// ГЕНЕРАЦИЯ МАССИВА
function triggerArraySync() {
    console.log("Динамическое обновление массива чисел...");
    const mode = fillMode ? fillMode.value : 'random';
    const size = sizeInput ? parseInt(sizeInput.value) : 10;
    let arr = [];

    if (mode === 'manual') {
        const raw = manualInput ? manualInput.value : "";
        arr = raw.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    } else {
        for (let i = 0; i < size; i++) {
            arr.push(Math.floor(Math.random() * 100) + 5);
        }
    }

    sharedBaseArray = arr;
    applyArrayToState(state1, sharedBaseArray);
    if (wrapper && wrapper.classList.contains('split-mode')) {
        applyArrayToState(state2, sharedBaseArray);
    }
    renderBars();
}

function applyArrayToState(state, baseArr) {
    state.array = [...baseArr];
    state.frames = [];
    state.currentFrameIndex = 0;
    state.comparisons = 0;
    state.swaps = 0;
    state.isSorting = false;
    if (state.stats.comp) state.stats.comp.innerText = '0';
    if (state.stats.swap) state.stats.swap.innerText = '0';
    if (state.stats.status) state.stats.status.innerText = 'Ожидание';
}

// ОТРИСОВКА СТОЛБИКОВ
function renderBars() {
    if (!wrapper) return;
    wrapper.innerHTML = '';

    const createView = (state) => {
        const view = document.createElement('div');
        view.className = 'vis-view';
        state.domElements = [];
        
        if (state.array.length === 0) return view;
        const maxVal = Math.max(...state.array, 1);

        state.array.forEach(val => {
            const barWrapper = document.createElement('div');
            barWrapper.className = 'bar-wrapper';

            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = `${(val / maxVal) * 85}%`;

            const label = document.createElement('div');
            label.className = 'bar-label';
            label.innerText = val;

            barWrapper.appendChild(bar);
            barWrapper.appendChild(label);
            view.appendChild(barWrapper);

            state.domElements.push({ bar, label });
        });
        return view;
    };

    wrapper.appendChild(createView(state1));
    if (wrapper.classList.contains('split-mode')) {
        wrapper.appendChild(createView(state2));
    }
}

// Промис для асинхронного чтения файла прямо перед отправкой запроса
function readSelectedFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve(evt.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
    });
}

// --- ОТПРАВКА НА БЭКЕНД И АНИМАЦИЯ ---

async function startSorting(state) {
    if (state.isSorting) return;

    // СБРОС СЧЁТЧИКОВ И ИНТЕРФЕЙСА ПЕРЕД ПЕРЕЗАПУСКОМ
    state.comparisons = 0;
    state.swaps = 0;
    if (state.stats.comp) state.stats.comp.innerText = '0';
    if (state.stats.swap) state.stats.swap.innerText = '0';

    state.isSorting = true;
    
    if (state.stats.status) state.stats.status.innerText = 'Запрос к Python...';
    const algoKey = state.id === 's1' ? algoSelect.value : algoSelect2.value;

    console.log(`Отправка текущего JS-массива в Python. Окно ${state.id}. Алгоритм: ${algoKey}`);

    try {
        let response;
        if (state.id === 's2' && algoKey === 'custom') {
            // Проверяем, выбрал ли пользователь файл вообще
            if (!selectedFileObject) {
                alert("Загрузите .py файл вашей сортировки перед запуском!");
                throw new Error("Файл не выбран");
            }
            
            if (state.stats.status) state.stats.status.innerText = 'Чтение файла...';
            
            // ЧИТАЕМ СВЕЖУЮ ВЕРСИЮ ФАЙЛА С ДИСКА СТРОГО ПРИ НАЖАТИИ КНОПКИ ПЛЕЙ
            const fileContent = await readSelectedFile(selectedFileObject);
            state.customFile = { name: selectedFileObject.name, content: fileContent };
            console.log(`Файл ${selectedFileObject.name} успешно перечитан с диска при старте.`);

            response = await fetch(`${BACKEND_URL}/api/sort/custom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: state.customFile.content, arr: state.array })
            });
        } else {
            response = await fetch(`${BACKEND_URL}/api/sort/standard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ algo: algoKey, arr: state.array })
            });
        }

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Ошибка сервера");
        }

        const data = await response.json();
        state.frames = data.frames || [];
        console.log(`Получены шаги сортировки от Python:`, state.frames.length, "кадров");
        
        if (state.stats.status) state.stats.status.innerText = 'Сортировка...';
        state.currentFrameIndex = 0;
        animateFrames(state);
    } catch (e) {
        console.error("Ошибка при работе с бэкендом:", e);
        if (state.stats.status) state.stats.status.innerText = 'Ошибка';
        alert(`Ошибка: ${e.message}`);
        state.isSorting = false;
    }
}

async function animateFrames(state) {
    const wait = () => new Promise(resolve => {
        if (stepModeCheck && stepModeCheck.checked) {
            if (state.id === 's1') stepResolver1 = resolve;
            else stepResolver2 = resolve;
            if (nextStepBtn) nextStepBtn.disabled = false;
        } else {
            setTimeout(resolve, 1010 - (speedInput ? speedInput.value : 500));
        }
    });

    while (state.currentFrameIndex < state.frames.length) {
        const frame = state.frames[state.currentFrameIndex];
        resetColors(state);

        if (frame.type === 'compare') {
            state.comparisons++;
            if (state.stats.comp) state.stats.comp.innerText = state.comparisons;
            frame.indexes.forEach(idx => {
                if (state.domElements[idx]?.bar) state.domElements[idx].bar.style.backgroundColor = 'var(--color-compare)';
            });
        } else if (frame.type === 'update') {
            state.swaps++;
            if (state.stats.swap) state.stats.swap.innerText = state.swaps;
            const idx = frame.index;
            const newVal = frame.value;
            
            if (state.domElements[idx]?.bar) {
                state.domElements[idx].bar.style.backgroundColor = 'var(--color-swap)';
                state.domElements[idx].label.innerText = newVal;
                const maxVal = Math.max(...state.array, newVal, 1);
                state.domElements[idx].bar.style.height = `${(newVal / maxVal) * 85}%`;
                state.array[idx] = newVal;
            }
        }
        
        state.currentFrameIndex++;
        await wait();
    }

    resetColors(state);
    state.domElements.forEach(el => { if (el.bar) el.bar.style.backgroundColor = 'var(--color-sorted)'; });
    if (state.stats.status) state.stats.status.innerText = 'Готово';
    state.isSorting = false;
    if (nextStepBtn) nextStepBtn.disabled = true;
}

if (stepModeCheck) {
    stepModeCheck.onchange = () => {
        if (!stepModeCheck.checked) {
            if (stepResolver1) { const r = stepResolver1; stepResolver1 = null; r(); }
            if (stepResolver2) { const r = stepResolver2; stepResolver2 = null; r(); }
        }
    };
}

function resetColors(state) {
    state.domElements.forEach(el => { if (el.bar) el.bar.style.backgroundColor = 'var(--color-bar)'; });
}

// --- НАВЕШИВАНИЕ СОБЫТИЙ С ИНТЕРФЕЙСА ---

if (sizeInput && sizeVal) {
    sizeInput.oninput = () => { 
        sizeVal.innerText = sizeInput.value; 
        triggerArraySync(); 
    };
}

if (fillMode) {
    fillMode.onchange = () => {
        if (fillMode.value === 'manual') {
            if (manualInputBox) manualInputBox.style.display = 'flex';
            if (sizeControlBox) sizeControlBox.style.display = 'none';
        } else {
            if (manualInputBox) manualInputBox.style.display = 'none';
            if (sizeControlBox) sizeControlBox.style.display = 'flex';
        }
        triggerArraySync(); 
    };
}

if (manualInput) {
    manualInput.oninput = () => {
        triggerArraySync(); 
    };
}

if (generateBtn) generateBtn.onclick = () => triggerArraySync();

if (startBtn) {
    startBtn.onclick = () => {
        startSorting(state1);
        if (wrapper && wrapper.classList.contains('split-mode')) {
            startSorting(state2);
        }
    };
}

if (algoSelect) algoSelect.onchange = () => updateAlgoInfo(state1, algoSelect, complexityDisplay);
if (algoSelect2) algoSelect2.onchange = () => updateAlgoInfo(state2, algoSelect2, complexityDisplay2);

if (algoFileInput) {
    // Безопасный сброс значения ПЕРЕД открытием окна. 
    // Браузер видит прямую активность (User Activation) и никогда не заблокирует диалог.
    algoFileInput.onclick = function() {
        this.value = '';
    };

    algoFileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            console.log("Файл успешно выбран пользователем:", file.name);
            if (fileLabel) {
                fileLabel.innerText = file.name;
            }
            // Сохраняем ссылку на объект файла. Читать с диска его будем строго на кнопке Play.
            selectedFileObject = file;
        }
    };
}

if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const isSplit = wrapper.classList.contains('split-mode');
        if (!isSplit) {
            wrapper.classList.remove('single-mode');
            wrapper.classList.add('split-mode');
            if (panel2) panel2.style.display = 'grid';
            if (settings2) settings2.style.display = 'flex'; 
            toggleBtn.innerText = 'Объединить окна';
            initSecondWindowStats();
            applyArrayToState(state2, sharedBaseArray);
            renderBars();
        } else {
            wrapper.classList.remove('split-mode');
            wrapper.classList.add('single-mode');
            if (panel2) panel2.style.display = 'none';
            if (settings2) settings2.style.display = 'none';
            toggleBtn.innerText = 'Сравнить алгоритмы';
        }
    });
}

if (nextStepBtn) {
    nextStepBtn.onclick = () => {
        if (stepResolver1) { const r = stepResolver1; stepResolver1 = null; r(); }
        if (stepResolver2) { const r = stepResolver2; stepResolver2 = null; r(); }
    };
}

// --- СТАРТ ПРИ ПЕРВОЙ ЗАГРУЗКЕ СТРАНИЦЫ ---
window.onload = () => {
    console.log("Страница загружена. Запуск инициализации...");
    loadAlgoConfig();
    triggerArraySync();
};
