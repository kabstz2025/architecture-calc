// Този файл е "диригентът" - свързва всичко и добавя event listeners.
document.addEventListener('DOMContentLoaded', () => {
    
    // --- ОСНОВНА ФУНКЦИЯ, КОЯТО СЕ ИЗВИКВА ПРИ ПРОМЯНА ---
    function handleCalculation() {
        const inputs = {
            objectName: document.getElementById('objectName').value,
            buildingType: document.getElementById('buildingType').value,
            area: parseFloat(document.getElementById('buildingArea').value),
            phase: parseInt(document.getElementById('designPhase').value),
            planType: document.getElementById('planType').value,
            plotCount: document.getElementById('plotCount').value,
            plotArea: document.getElementById('plotArea').value,
            designerType: document.getElementById('designerType').value,
            hours: parseFloat(document.getElementById('hoursWorked').value),
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
        const result = Calculator.calculate(inputs);
        UI.updateResults(result, inputs);
    }

    // --- УПРАВЛЕНИЕ НА СЪСТОЯНИЕТО (SAVE/LOAD) ---
    function saveState() {
        const state = {};
        document.querySelectorAll('.calc-input').forEach(input => {
            state[input.id] = (input.type === 'checkbox') ? input.checked : input.value;
        });
        const date = new Date();
        const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
        const filename = `${timestamp}_${state.objectName || 'proekt'}.json`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function loadState(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const state = JSON.parse(e.target.result);
                for (const id in state) {
                    const input = document.getElementById(id);
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = state[id];
                        } else {
                            input.value = state[id];
                        }
                    }
                }
                updateSectionVisibility();
                handleCalculation();
            } catch {
                alert('Грешка: Невалиден файл.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
    
    // --- ПОМОЩНИ ФУНКЦИИ ЗА UI ---
    function exportToTxt() {
        const objectName = document.getElementById('objectName').value || 'Неозаглавен обект';
        const logContent = document.getElementById('calculationLog').innerText;
        const finalPriceText = `${document.getElementById('totalHeader').textContent} ${document.getElementById('totalPrice').textContent}`;
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

    const sidebarToggles = { 
        'toggleNewBuildings': 'newBuildingsSection', 
        'toggleDevelopmentPlans': 'developmentPlansSection', 
        'toggleHourlyRate': 'hourlyRateSection' 
    };

    function updateSectionVisibility() {
        for (const toggleId in sidebarToggles) {
            const checkbox = document.getElementById(toggleId);
            const section = document.getElementById(sidebarToggles[toggleId]);
            if (checkbox && section) {
                section.classList.toggle('section-hidden', !checkbox.checked);
            }
        }
    }
    
    // --- ПРИКРЕПЯНЕ НА EVENT LISTENERS ---
    
    document.querySelectorAll('.calc-input').forEach(input => {
        input.addEventListener('input', handleCalculation);
        input.addEventListener('change', handleCalculation);
    });

    // --- НОВА ЛОГИКА ---
    // Взаимно изключване на чекбоксовете за реконструкция
    const reconstructionExistingCheckbox = document.getElementById('coefReconstructionExisting');
    const reconstructionMissingCheckbox = document.getElementById('coefReconstructionMissing');

    reconstructionExistingCheckbox.addEventListener('change', () => {
        if (reconstructionExistingCheckbox.checked) {
            reconstructionMissingCheckbox.checked = false;
        }
        // handleCalculation() ще се извика автоматично от общия listener по-горе
    });

    reconstructionMissingCheckbox.addEventListener('change', () => {
        if (reconstructionMissingCheckbox.checked) {
            reconstructionExistingCheckbox.checked = false;
        }
        // handleCalculation() ще се извика автоматично от общия listener по-горе
    });
    // --- КРАЙ НА НОВАТА ЛОГИКА ---

    // Бутони
    document.getElementById('openTableBtn').addEventListener('click', () => UI.openPriceTable());
    document.getElementById('saveButton').addEventListener('click', saveState);
    document.getElementById('loadButton').addEventListener('click', () => document.getElementById('loadInput').click());
    document.getElementById('loadInput').addEventListener('change', loadState);
    document.getElementById('printButton').addEventListener('click', () => {
        const log = document.getElementById('calculationLog').innerText;
        const price = `${document.getElementById('totalHeader').textContent} ${document.getElementById('totalPrice').textContent}`;
        const name = document.getElementById('objectName').value || 'Неозаглавен обект';
        UI.printOffer(log, price, name);
    });
    document.getElementById('exportTxtButton').addEventListener('click', exportToTxt);
    document.getElementById('manualButton').addEventListener('click', () => UI.showManual());
    document.getElementById('toggleSidebarBtn').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('sidebar-collapsed');
    });

    for (const toggleId in sidebarToggles) {
        document.getElementById(toggleId).addEventListener('change', updateSectionVisibility);
    }
    
    const themeToggle = document.getElementById('theme-toggle');
    function setTheme(themeName) {
        localStorage.setItem('calculatorTheme', themeName);
        document.body.className = themeName;
    }
    themeToggle.addEventListener('click', () => {
        setTheme(document.body.classList.contains('theme-dark') ? 'theme-light' : 'theme-dark');
    });

    const contactModal = document.getElementById('contactModal');
    document.getElementById('user-icon-button').addEventListener('click', () => contactModal.classList.add('show'));
    document.getElementById('modalCloseButton').addEventListener('click', () => contactModal.classList.remove('show'));
    contactModal.addEventListener('click', (event) => { if (event.target === contactModal) contactModal.classList.remove('show'); });


    // --- ИНИЦИАЛИЗАЦИЯ ПРИ ЗАРЕЖДАНЕ НА СТРАНИЦАТА ---
    updateSectionVisibility();
    const savedTheme = localStorage.getItem('calculatorTheme');
    setTheme(savedTheme === 'theme-dark' ? 'theme-dark' : 'theme-light');
    document.getElementById('copyright-year').textContent = new Date().getFullYear();
    handleCalculation();
});