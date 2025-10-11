// Този файл съдържа само логиката за изчисление. Не променя нищо на екрана.
const Calculator = {
    calculate(inputs) {
        let newBuildingPrice = 0, pupPrice = 0, hourlyPrice = 0;
        let log = [];
        let hintMessages = [];

        // --- ЧАСТ 1: Изчисляване на базовите цени за всяка секция ---

        if (inputs.toggleNewBuildings) {
            const isComplete = inputs.buildingType !== "0" && !isNaN(inputs.area) && inputs.area > 0 && inputs.phase !== 0;
            if (isComplete) {
                const prices = newBuildingPrices[inputs.buildingType];
                const minArea = parseFloat(Object.keys(prices.min)[0]);
                if (inputs.area <= minArea) {
                    newBuildingPrice = prices.min[minArea][inputs.phase - 1];
                    log.push(`Нови сгради (${buildingTypeMap[inputs.buildingType]}, ${designPhaseMap[inputs.phase]}): ${newBuildingPrice.toFixed(2)} лв. (мин. цена)`);
                } else {
                    const areaRanges = Object.keys(prices.per_sqm).map(Number).sort((a, b) => a - b);
                    let rate = prices.per_sqm["Infinity"][inputs.phase - 1];
                    for (const range of areaRanges) {
                        if (inputs.area <= range) { rate = prices.per_sqm[range][inputs.phase - 1]; break; }
                    }
                    newBuildingPrice = inputs.area * rate;
                    log.push(`Нови сгради (${buildingTypeMap[inputs.buildingType]}, ${designPhaseMap[inputs.phase]}): ${inputs.area} м² * ${rate.toFixed(2)} лв./м² = ${newBuildingPrice.toFixed(2)} лв.`);
                }
            } else {
                hintMessages.push("Попълнете вид, РЗП и фаза за 'Нови сгради'.");
            }
        }

        if (inputs.toggleDevelopmentPlans) {
            const isComplete = inputs.planType !== "0" && inputs.plotCount !== "0" && inputs.plotArea !== "0";
            if (isComplete) {
                pupPrice = planPrices[inputs.planType][inputs.plotCount][inputs.plotArea - 1];
                log.push(`ПУП: ${pupPrice.toFixed(2)} лв.`);
            } else {
                hintMessages.push("Попълнете вид ПУП, брой и площ.");
            }
        }

        if (inputs.toggleHourlyRate) {
            const isComplete = parseFloat(inputs.designerType) > 0 && !isNaN(inputs.hours) && inputs.hours > 0;
            if (isComplete) {
                const rate = parseFloat(inputs.designerType);
                hourlyPrice = rate * inputs.hours;
                log.push(`Часова ставка: ${hourlyPrice.toFixed(2)} лв.`);
            } else {
                hintMessages.push("Попълнете тип проектант и часове.");
            }
        }

        // Ако няма никакви изчислени цени, показваме само съобщенията
        const totalBasePrice = newBuildingPrice + pupPrice + hourlyPrice;
        if (totalBasePrice === 0 && hintMessages.length > 0) {
            return { hintMessages, log: [], currentTotal: 0 };
        }
        
        // --- ЧАСТ 2: Прилагане на коефициенти САМО върху цената за "Нови сгради" ---
        
        let adjustedBuildingPrice = newBuildingPrice;
        let coefLog = [];

        // Базата за коефициентите, които добавят процент (варианти, повторения), е ВИНАГИ оригиналната цена.
        const buildingsBaseForCoef = newBuildingPrice;

        if (inputs.difficultyPercent !== 0 && buildingsBaseForCoef > 0) {
            const difficultyAddition = buildingsBaseForCoef * (inputs.difficultyPercent / 100);
            adjustedBuildingPrice += difficultyAddition;
            let logMsg = `+ Трудност (${inputs.difficultyPercent > 0 ? '+' : ''}${inputs.difficultyPercent}% от Нови сгради): ${difficultyAddition.toFixed(2)} лв.`;
            if (inputs.difficultyNotes) logMsg += ` (${inputs.difficultyNotes})`;
            coefLog.push(logMsg);
        }
        
        if (inputs.coefVariant && buildingsBaseForCoef > 0) { 
            const variantAddition = buildingsBaseForCoef * 0.5; 
            adjustedBuildingPrice += variantAddition; 
            coefLog.push(`+ Доп. вариант: +${variantAddition.toFixed(2)} лв.`); 
        }
        
        if (inputs.repetitions > 1 && buildingsBaseForCoef > 0) {
            const extraUnits = inputs.repetitions - 1;
            const coef = inputs.repetitions >= 6 ? 0.4 : 0.5;
            const repetitionAddition = extraUnits * buildingsBaseForCoef * coef;
            adjustedBuildingPrice += repetitionAddition;
            coefLog.push(`+ ${extraUnits} Повторения (x${coef}): +${repetitionAddition.toFixed(2)} лв.`);
        }

        const multCheckboxes = [
            { checked: inputs.coefReconstructionExisting, text: 'Реконструкция (с налична документация)', value: 1.5 },
            { checked: inputs.coefReconstructionMissing, text: 'Реконструкция (без налична документация)', value: 2.0 },
            { checked: inputs.coefAccelerated, text: 'Ускорено проектиране', value: 1.5 }
        ];

        // Коефициентите, които умножават, се прилагат върху вече коригираната цена
        multCheckboxes.forEach(cb => {
            if (cb.checked && newBuildingPrice > 0) {
                adjustedBuildingPrice *= cb.value;
                coefLog.push(`* ${cb.text}: x${cb.value}`);
            }
        });

        if (coefLog.length > 0) {
            log.push(`<b>Коефициенти (приложени към 'Нови сгради'):</b>\n${coefLog.join('\n')}`);
            log.push(`<b>Коригирана цена 'Нови сгради': ${adjustedBuildingPrice.toFixed(2)} лв.</b>`);
        }

        // --- ЧАСТ 3: Изчисляване на финалната сума ---
        const finalTotal = adjustedBuildingPrice + pupPrice + hourlyPrice;

        const summaryParts = [];
        if (adjustedBuildingPrice > 0) summaryParts.push(`${adjustedBuildingPrice.toFixed(2)} лв. (Сгради)`);
        if (pupPrice > 0) summaryParts.push(`${pupPrice.toFixed(2)} лв. (ПУП)`);
        if (hourlyPrice > 0) summaryParts.push(`${hourlyPrice.toFixed(2)} лв. (Часова ст.)`);

        if (summaryParts.length > 1) {
            log.push(`<b>ОБЩО = ${summaryParts.join(' + ')} = ${finalTotal.toFixed(2)} лв.</b>`);
        }

        return { hintMessages, log, currentTotal: finalTotal };
    }
};