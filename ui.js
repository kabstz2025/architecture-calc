const UI = {
    elements: {},

    init() {
        this.elements = {
            totalPriceEl: document.getElementById('totalPrice'),
            totalHeader: document.getElementById('totalHeader'),
            calculationLogEl: document.getElementById('calculationLog'),
            displayObjectNameEl: document.getElementById('displayObjectName'),
            priceTableContainer: document.getElementById('priceTableContainer')
        };
    },

    updateResults(result, inputs) {
        this.elements.displayObjectNameEl.textContent = inputs.objectName;
        this.elements.displayObjectNameEl.style.display = inputs.objectName ? 'block' : 'none';

        let logToDisplay = [...result.log];
        
        if (inputs.currency === 'eur') {
            logToDisplay = result.log.map(line => {
                return line.replace(/(\d+\.\d{2})\s*лв\./g, (match, bgnAmount) => {
                    const eurAmount = (parseFloat(bgnAmount) / EURO_RATE).toFixed(2);
                    return `${eurAmount} €`;
                }).replace(/лв\.\/бр\./g, '€/бр.').replace(/лв\.\/м²/g, '€/м²');
            });
        } else if (inputs.currency === 'both') {
            logToDisplay = result.log.map(line => {
                return line.replace(/(\d+\.\d{2})\s*лв\./g, (match, bgnAmountStr) => {
                    const bgnAmount = parseFloat(bgnAmountStr);
                    const eurAmount = (bgnAmount / EURO_RATE).toFixed(2);
                    return `${match} (${eurAmount} €)`;
                });
            });
        }
        
        let finalLog = logToDisplay.join('\n\n');
        if (result.hintMessages.length > 0) {
            if (finalLog.length > 0) finalLog += `\n\n<hr style="border: 0; border-top: 1px solid var(--border-color);">`;
            finalLog += `<b>За довършване:</b>\n- ${result.hintMessages.join('\n- ')}`;
        }
        if (finalLog.trim() === "") finalLog = "Моля, попълнете данните в желаната секция.";
        
        this.elements.calculationLogEl.innerHTML = finalLog;
        
        const totalInEur = result.currentTotal / EURO_RATE;
        let outputText = "";
        switch (inputs.currency) {
            case 'eur':
                this.elements.totalHeader.textContent = 'ОБЩО (€ без ДДС):';
                outputText = totalInEur.toFixed(2) + ' €';
                break;
            case 'both':
                this.elements.totalHeader.textContent = 'ОБЩО (лв. и € без ДДС):';
                outputText = result.currentTotal.toFixed(2) + ` лв. (${totalInEur.toFixed(2)} €)`;
                break;
            default:
                this.elements.totalHeader.textContent = 'ОБЩО (лв. без ДДС):';
                outputText = result.currentTotal.toFixed(2) + ' лв.';
                break;
        }
        this.elements.totalPriceEl.textContent = outputText;
    },

    openPriceTable() {
        const tableHtml = this.elements.priceTableContainer.innerHTML;
        const newWindow = window.open("", "TableWindow", "width=1200,height=800,scrollbars=yes,resizable=yes");
        newWindow.document.write(`<html><head><title>Таблица за справка</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:center}th{background-color:#e9e9e9}.table-cat-single-family{background-color:#fff2cc}.table-cat-multi-family{background-color:#ffe699}.table-cat-standard-public{background-color:#f8cbad}.table-cat-special-public{background-color:#f4b183}.table-cat-warehouse{background-color:#d9ead3}.table-cat-industrial{background-color:#cfe2f3}.table-cat-pup,.table-cat-hourly{background-color:#f3f3f3}</style></head><body>${tableHtml}</body></html>`);
        newWindow.document.close();
    },

    printOffer(logContent, finalPriceText, objectName) {
        const printHtml = `<html><head><title>Оферта за ${objectName}</title><style>body{font-family: Arial, sans-serif; margin: 30px;} h1, h2, h3 {margin-bottom: 5px; color: #333;} h1{font-size: 24px;} h2{font-size:20px;} hr {margin: 20px 0; border: 0; border-top: 1px solid #ccc;} pre {white-space: pre-wrap; font-family: monospace; font-size: 14px; background-color: #f4f4f4; padding: 15px; border-radius: 5px; border: 1px solid #eee;}</style></head><body><h1>Минимална себестойност на проектиране – ЧАСТ АРХИТЕКТУРА</h1><h2>Обект: ${objectName}</h2><hr><h3>Начин на изчисляване:</h3><pre>${logContent}</pre><hr><h2>${finalPriceText}</h2></body></html>`;
        const win = window.open('', '', 'height=700,width=800');
        win.document.write(printHtml);
        win.document.close();
        win.print();
    },

    showManual() {
        const manualHtml = `<html><head><title>Инструкции за работа</title><style>body{font-family: Arial, sans-serif; margin: 30px; line-height: 1.6;} h2{border-bottom: 1px solid #ccc; padding-bottom: 5px;} ul{padding-left: 20px;} strong{color: #005a9e;}</style></head><body><h1>Инструкции за работа с калкулатора</h1><h2>Общ преглед</h2><p>Калкулаторът е разделен на две основни части: лява (за въвеждане на данни) и дясна (странична лента с настройки и коефициенти).</p><h2>Основни секции за изчисление</h2><ul><li><strong>Нови сгради:</strong> Основен модул за изчисляване на цената на база РЗП.</li><li><strong>Подробни устройствени планове (ПУП):</strong> За изчисляване на ПУП.</li><li><strong>Часова ставка:</strong> За изчисляване на работа на база вложени часове.</li></ul><p>Можете да включвате и изключвате тези секции от меню "Настройки" в страничната лента. Цените от активните секции се сумират автоматично.</p><h2>Странична лента "Настройки"</h2><ul><li><strong>Проект:</strong> Въведете име на обекта. Можете да запазите (Save) цялата калкулация в .json файл или да заредите (Load) предишна.</li><li><strong>Валута:</strong> Изберете как да се покаже крайната цена.</li><li><strong>Допълнителни коефициенти:</strong><ul><li><strong>Разработване на варианти:</strong> Добавя +50% към общата основна цена.</li><li><strong>Общ брой повторения:</strong> Въведете ОБЩИЯ брой обекти (напр. 3, ако имате 1 оригинал и 2 повторения). Цената за допълнителните обекти се добавя към основната с коефициент 0.5 (за 2-5 обекта) или 0.4 (за 6+ обекта).</li><li><strong>Реконструкция / Ускорено проектиране:</strong> Умножават крайната сума със съответния коефициент.</li></ul></li><li><strong>Трудност:</strong> Процентът, който въведете тук, се прилага САМО върху сумата, изчислена от секция "Нови сгради". Можете да въведете и пояснение.</li></ul><h2>Резултат и експорт</h2><p>В зелената зона виждате крайната цена и подробна разбивка на изчисленията. С бутоните отдолу можете да принтирате оферта или да я експортнете като .txt файл.</p></body></html>`;
        const win = window.open('', 'ManualWindow', 'height=700,width=800,scrollbars=yes');
        win.document.write(manualHtml);
        win.document.close();
    }
};