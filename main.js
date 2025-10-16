document.addEventListener('DOMContentLoaded', () => {
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    UI.init();
    
    const LOCAL_STORAGE_KEY = 'calculatorState';

    // --- ЕДИННА ФУНКЦИЯ ЗА ОБНОВЯВАНЕ ---
    function runUpdate() {
        updateSectionVisibility();
        const inputs = gatherInputs();
        const result = Calculator.calculate(inputs);
        UI.updateResults(result, inputs);
        saveStateToLocalStorage();
    }
    
    function gatherInputs() {
        return {
            objectName: document.getElementById('objectName').value,
            buildingType: document.getElementById('buildingType').value,
            area: parseFloat(document.getElementById('buildingArea').value) || 0,
            phase: parseInt(document.getElementById('designPhase').value) || 0,
            planType: document.getElementById('planType').value,
            plotCount: parseInt(document.getElementById('plotCount').value) || 0,
            plotArea: document.getElementById('plotArea').value,
            designerType: document.getElementById('designerType').value,
            hours: parseFloat(document.getElementById('hoursWorked').value) || 0,
            currency: document.getElementById('currencyDisplay').value,
            difficultyPercent: parseFloat(document.getElementById('difficultyPercent').value) || 0,
            difficultyNotes: document.getElementById('difficultyNotes').value.trim(),
            repetitions: parseInt(document.getElementById('repetitionCount').value) || 0,
            toggleNewBuildings: document.getElementById('toggleNewBuildings').checked,
            toggleDevelopmentPlans: document.getElementById('toggleDevelopmentPlans').checked,
            toggleHourlyRate: document.getElementById('toggleHourlyRate').checked,
            coefVariant: document.getElementById('coefVariant').checked,
            coefReconstructionExisting: document.getElementById('coefReconstructionExisting').checked,
            coefReconstructionMissing: document.getElementById('coefReconstructionMissing').checked,
            coefAccelerated: document.getElementById('coefAccelerated').checked
        };
    }
    
    // --- УПРАВЛЕНИЕ НА СЪСТОЯНИЕТО ---
    function saveStateToLocalStorage() {
        const state = {};
        document.querySelectorAll('.calc-input').forEach(input => {
            state[input.id] = (input.type === 'checkbox') ? input.checked : input.value;
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }

    function loadStateFromLocalStorage() {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                for (const id in state) {
                    const input = document.getElementById(id);
                    if (input) {
                        if (input.type === 'checkbox') input.checked = state[id];
                        else input.value = state[id];
                    }
                }
            } catch { localStorage.removeItem(LOCAL_STORAGE_KEY); }
        }
    }

    function resetState() {
        if (confirm("Сигурни ли сте, че искате да изчистите всички полета?")) {
            document.querySelectorAll('.calc-input').forEach(input => {
                if (input.type === 'checkbox') input.checked = (input.id === 'toggleNewBuildings');
                else if (input.tagName === 'SELECT') input.selectedIndex = 0;
                else input.value = '';
            });
            runUpdate();
        }
    }

    function saveStateToFile() {
        const state = gatherInputs();
        const date = new Date();
        const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
        const filename = `${timestamp}_${state.objectName || 'proekt'}.json`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function loadStateFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const state = JSON.parse(e.target.result);
                for (const id in state) {
                    const input = document.getElementById(id);
                    if (input) {
                        if (input.type === 'checkbox') input.checked = state[id];
                        else input.value = state[id];
                    }
                }
                runUpdate();
            } catch { alert('Грешка: Невалиден файл.'); }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
    
    // --- УПРАВЛЕНИЕ НА UI ---
    const sidebarToggles = { 
        'toggleNewBuildings': 'newBuildingsSection', 
        'toggleDevelopmentPlans': 'developmentPlansSection', 
        'toggleHourlyRate': 'hourlyRateSection' 
    };
    function updateSectionVisibility() {
        for (const toggleId in sidebarToggles) {
            const checkbox = document.getElementById(toggleId);
            const section = document.getElementById(sidebarToggles[toggleId]);
            if (checkbox && section) section.classList.toggle('section-hidden', !checkbox.checked);
        }
    }

    function exportToTxt() {
        const objectName = document.getElementById('objectName').value || 'Неозаглавен обект';
        const logContent = UI.elements.calculationLogEl.innerText;
        const finalPriceText = `${UI.elements.totalHeader.textContent} ${UI.elements.totalPriceEl.textContent}`;
        const title = "Минимална себестойност на проектиране – ЧАСТ АРХИТЕКТУРА";
        const subtitle = `Обект: ${objectName}`;
        const fullText = `${title}\n${subtitle}\n\nНачин на изчисляване:\n${logContent}\n\n${finalPriceText}`;
        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
        const date = new Date();
        const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
        const filename = `${timestamp}_${objectName || 'oferta'}.txt`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename; a.click(); URL.revokeObjectURL(a.href);
    }
    
    // --- ПРИКРЕПЯНЕ НА EVENT LISTENERS ---
    document.querySelectorAll('.calc-input').forEach(input => {
        input.addEventListener('input', runUpdate);
        input.addEventListener('change', runUpdate);
    });

    const reconstructionExistingCheckbox = document.getElementById('coefReconstructionExisting');
    const reconstructionMissingCheckbox = document.getElementById('coefReconstructionMissing');
    reconstructionExistingCheckbox.addEventListener('change', () => {
        if (reconstructionExistingCheckbox.checked) {
            reconstructionMissingCheckbox.checked = false;
        }
        runUpdate();
    });
    reconstructionMissingCheckbox.addEventListener('change', () => {
        if (reconstructionMissingCheckbox.checked) {
            reconstructionExistingCheckbox.checked = false;
        }
        runUpdate();
    });

    document.getElementById('openTableBtn').addEventListener('click', () => UI.openPriceTable());
    document.getElementById('saveButton').addEventListener('click', saveStateToFile);
    document.getElementById('loadButton').addEventListener('click', () => document.getElementById('loadInput').click());
    document.getElementById('loadInput').addEventListener('change', loadStateFromFile);
    document.getElementById('resetButton').addEventListener('click', resetState);
    document.getElementById('printButton').addEventListener('click', () => {
        const log = UI.elements.calculationLogEl.innerText;
        const price = `${UI.elements.totalHeader.textContent} ${UI.elements.totalPriceEl.textContent}`;
        const name = document.getElementById('objectName').value || 'Неозаглавен обект';
        UI.printOffer(log, price, name);
    });
    document.getElementById('exportTxtButton').addEventListener('click', exportToTxt);
    document.getElementById('manualButton').addEventListener('click', () => UI.showManual());
    document.getElementById('toggleSidebarBtn').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('sidebar-collapsed'));
    
    const themeToggle = document.getElementById('theme-toggle');
    function setTheme(themeName) {
        localStorage.setItem('calculatorTheme', themeName);
        document.body.className = themeName;
    }
    themeToggle.addEventListener('click', () => setTheme(document.body.classList.contains('theme-dark') ? 'theme-light' : 'theme-dark'));

    const contactModal = document.getElementById('contactModal');
    document.getElementById('user-icon-button').addEventListener('click', () => contactModal.classList.add('show'));
    document.getElementById('modalCloseButton').addEventListener('click', () => contactModal.classList.remove('show'));
    contactModal.addEventListener('click', (event) => { if (event.target === contactModal) contactModal.classList.remove('show'); });
    
    // --- ПЪРВОНАЧАЛНО ЗАРЕЖДАНЕ ---
    loadStateFromLocalStorage();
    const savedTheme = localStorage.getItem('calculatorTheme');
    setTheme(savedTheme === 'theme-dark' ? 'theme-dark' : 'theme-light');
    document.getElementById('copyright-year').textContent = new Date().getFullYear();
    runUpdate();
});