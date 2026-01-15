// Holidays management
// Default holidays (used as fallback if holidays.json can't be loaded)
const defaultHolidays = [
	{ "date": "2026-01-01", "name": "Нова година" },
	{ "date": "2026-01-02", "name": "Нова година" },
	{ "date": "2026-03-03", "name": "Ден на Освобождението" },
	{ "date": "2026-04-10", "name": "Разпети петък" },
	{ "date": "2026-04-12", "name": "Великден" },
	{ "date": "2026-04-13", "name": "Великден" },
	{ "date": "2026-05-01", "name": "Ден на труда" },
	{ "date": "2026-05-06", "name": "Гергьовден" },
	{ "date": "2026-05-24", "name": "Ден на славянската писменост" },
	{ "date": "2026-05-25", "name": "Ден на славянската писменост" },
	{ "date": "2026-09-06", "name": "Ден на Съединението" },
	{ "date": "2026-09-07", "name": "Ден на Съединението" },
	{ "date": "2026-09-22", "name": "Ден на Независимостта" },
	{ "date": "2026-12-24", "name": "Бъдни вечер" },
	{ "date": "2026-12-25", "name": "Коледа" },
	{ "date": "2026-12-26", "name": "Коледа" },
	{ "date": "2026-12-27", "name": "Коледа" },
	{ "date": "2026-12-28", "name": "Коледа" }
];

let holidays = [];

async function loadHolidays() {
	try {
		const response = await fetch('holidays.json');
		if (!response.ok) throw new Error('Failed to load');
		holidays = await response.json();
	} catch (error) {
		console.log('Using default holidays (holidays.json not available)');
		holidays = defaultHolidays;
	}
	renderHolidays();
}

function formatDateKey(date) {
	return date.toISOString().split('T')[0];
}

function isHoliday(date) {
	const dateKey = formatDateKey(date);
	return holidays.some(h => h.date === dateKey);
}

function isNonWorkingDay(date) {
	return date.getDay() === 0 || date.getDay() === 6 || isHoliday(date);
}

function renderHolidays() {
	const list = document.querySelector('#holidays-list');
	
	if (holidays.length === 0) {
		list.innerHTML = '<p class="no-holidays">Няма добавени почивни дни</p>';
		return;
	}
	
	list.innerHTML = holidays.map(h => {
		const date = new Date(h.date);
		const dayOfWeek = date.getDay();
		const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
		const dayClass = isWeekend ? 'weekend' : 'weekday';
		const formattedDate = date.toLocaleDateString('bg-BG', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			weekday: 'long'
		});
		return `<div class="holiday-item ${dayClass}">
			<div class="holiday-date">${formattedDate}</div>
			<div class="holiday-name">${h.name}</div>
		</div>`;
	}).join('');
}

// Initialize holidays list on page load
document.addEventListener('DOMContentLoaded', loadHolidays);

function calculateDate() {
	const inputDate = new Date(document.querySelector('#input-date').value);
	const inputDay = inputDate.toLocaleDateString('bg-BG', {
		weekday: 'long'
	});
	const result = new Date(inputDate);
	const resultBox = document.querySelector('#date-result-box');

	// Проверка дали въведената дата е в уикенда или почивен ден
	if (isNonWorkingDay(inputDate)) {
		let message = 'Невалидна дата. ';
		if (isHoliday(inputDate)) {
			const holiday = holidays.find(h => h.date === formatDateKey(inputDate));
			message += `${holiday.name} е почивен ден.`;
		} else {
			message += 'Моля изберете работен ден.';
		}
		document.querySelector('#result').textContent = message;
		document.querySelector('#result-day').textContent = '';
		document.querySelector('#input-day').textContent = `(${inputDay})`;
		if (resultBox) resultBox.classList.add('error');
		return;
	}
	
	if (resultBox) resultBox.classList.remove('error');

	// Calculate base offset based on day of week
	let daysToSubtract;
	switch (inputDate.getDay()) {
		case 1:
		case 4:
			daysToSubtract = 20;
			break;
		case 2:
		case 5:
			daysToSubtract = 18;
			break;
		case 3:
			daysToSubtract = 19;
			break;
	}
	
	result.setDate(result.getDate() - daysToSubtract);
	
	// If result falls on a non-working day, move to previous working day
	while (isNonWorkingDay(result)) {
		result.setDate(result.getDate() - 1);
	}

	const resultDay = result.toLocaleDateString('bg-BG', {
		weekday: 'long'
	});

	document.querySelector('#result').textContent = result.toLocaleDateString('bg-BG', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});
	document.querySelector('#result-day').textContent = `(${resultDay})`;
	document.querySelector('#input-day').textContent = `(${inputDay})`;

	// Проверка дали резултатната дата е минала, днес или предстояща
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const resultDate = new Date(result);
	resultDate.setHours(0, 0, 0, 0);
	
	if (resultBox) {
		resultBox.classList.remove('result-passed', 'result-today');
		
		if (resultDate.getTime() === now.getTime()) {
			resultBox.classList.add('result-today');
			let statusMsg = document.createElement('div');
			statusMsg.className = 'result-status';
			statusMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Крайният срок е ДНЕС!';
			if (!resultBox.querySelector('.result-status')) {
				resultBox.appendChild(statusMsg);
			} else {
				resultBox.querySelector('.result-status').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Крайният срок е ДНЕС!';
			}
		} else if (resultDate < now) {
			resultBox.classList.add('result-passed');
			let statusMsg = document.createElement('div');
			statusMsg.className = 'result-status';
			statusMsg.innerHTML = '<i class="fas fa-times-circle"></i> Срокът е изтекъл';
			if (!resultBox.querySelector('.result-status')) {
				resultBox.appendChild(statusMsg);
			} else {
				resultBox.querySelector('.result-status').innerHTML = '<i class="fas fa-times-circle"></i> Срокът е изтекъл';
			}
		} else {
			const existingStatus = resultBox.querySelector('.result-status');
			if (existingStatus) {
				existingStatus.remove();
			}
		}
	}
}

function calculateMoney() {
	var priceBGN = document.querySelector('#priceBGN').value;
	var bidBGN = (priceBGN * 0.01).toFixed(2); // 1% of the input value
	var guaranteeBGN = Math.min(priceBGN * 0.05, priceBGN);
	var fivePBGN = priceBGN * 0.05;

	if (guaranteeBGN > 999) {
		guaranteeBGN = Math.floor(guaranteeBGN / 100) * 100; // round to the nearest hundred
	} else if (guaranteeBGN > 200 && guaranteeBGN < 999 ){
		guaranteeBGN = Math.floor(guaranteeBGN / 10) * 10; // round to the nearest ten
	} else {
		guaranteeBGN = Math.floor(guaranteeBGN/1)*1;
	}

	document.querySelector('#bidBGN').textContent = bidBGN;
	document.querySelector('#guaranteeBGN').textContent = guaranteeBGN;
	document.querySelector('#fivePBGN').textContent = fivePBGN.toFixed(2);
	percDiff();
}

function percDiff() {
	let priceBGN = parseFloat(document.querySelector('#priceBGN').value);
	let g2 = parseInt(document.querySelector('#guaranteeBGN').textContent);
	let percDiffBGN = ((g2 / priceBGN) * 100).toFixed(1);
	document.querySelector('#percentageBGN').innerHTML = ' (' + percDiffBGN + '%)';
	if (percDiffBGN > 5) {
		document.querySelector('#guaranteeBGN').style.backgroundColor = '#ff6b6b';
		document.querySelector('#guaranteeBGN').style.color = 'white';
	} else {
		document.querySelector('#guaranteeBGN').style.backgroundColor = '';
		document.querySelector('#guaranteeBGN').style.color = '';
	}
}
