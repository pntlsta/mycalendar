let calendar;
let eventToDelete = null;

document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');

  calendar = new FullCalendar.Calendar(calendarEl, {
  initialView: 'dayGridMonth',
  height: '100%',
  expandRows: true,
  fixedWeekCount: true,       // always show 6 rows
  dayMaxEventRows: true,      // cap visible events, adds "more" link
  events: loadTasks(),
  eventClick: function(info) {
    if (!info.event || !info.event.title) return;
    eventToDelete = info.event;
    document.getElementById('modalTitle').innerText = `Delete "${info.event.title}"?`;
    document.getElementById('modalDate').innerText = `On: ${info.event.startStr}`;
    document.getElementById('deleteModalOverlay').style.display = 'flex';
  }
});

  calendar.render();

  const colorOptions = document.querySelectorAll('.color-option');
const hiddenColorInput = document.getElementById('color');

// Default select the first color
colorOptions[0].classList.add('selected');
hiddenColorInput.value = colorOptions[0].dataset.color;

colorOptions.forEach(option => {
  option.addEventListener('click', () => {
    // Clear previous selection
    colorOptions.forEach(c => c.classList.remove('selected'));
    // Mark clicked one
    option.classList.add('selected');
    hiddenColorInput.value = option.dataset.color;
  });
});

  // Delete Modal
  document.getElementById('deleteConfirm').addEventListener('click', function() {
    if (eventToDelete) {
      eventToDelete.remove();
      let tasks = loadTasks();
      tasks = tasks.filter(task =>
        !(task.title === eventToDelete.title &&
          task.start === eventToDelete.startStr &&
          task.color === eventToDelete.backgroundColor)
      );
      saveTasks(tasks);
    }
    closeDeleteModal();
  });

  document.getElementById('deleteCancel').addEventListener('click', closeDeleteModal);

  // Reset Modal
  document.getElementById('resetCalendar').addEventListener('click', function() {
    document.getElementById('resetModalOverlay').style.display = 'flex';
  });

  document.getElementById('resetConfirm').addEventListener('click', function() {
    localStorage.removeItem('tasks');
    calendar.getEvents().forEach(event => event.remove());
    closeResetModal();
  });

  document.getElementById('resetCancel').addEventListener('click', closeResetModal);

  // Task form submit
  document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const color = document.getElementById('color').value;
    const repeat = document.getElementById('repeat').value;
    const weeklyDays = Array.from(document.querySelectorAll('#weekly-options input:checked')).map(cb => parseInt(cb.value));

    const newEvents = createEvents(title, date, color, repeat, weeklyDays);

    let tasks = loadTasks();
    tasks = tasks.concat(newEvents);
    saveTasks(tasks);

    newEvents.forEach(event => calendar.addEvent(event));

    this.reset();
    document.getElementById('color').value = "#ff0000";
    document.getElementById('weekly-options').style.display = "none";
    document.getElementById('custom-interval').style.display = "none";
  });

  // Show weekly/custom options
  document.getElementById('repeat').addEventListener('change', function() {
    document.getElementById('weekly-options').style.display = this.value === "weekly" ? "block" : "none";
    document.getElementById('custom-interval').style.display = this.value === "custom" ? "block" : "none";
  });
});

function loadTasks() {
  return JSON.parse(localStorage.getItem('tasks')) || [];
}

function saveTasks(events) {
  localStorage.setItem('tasks', JSON.stringify(events));
}

function closeDeleteModal() {
  document.getElementById('deleteModalOverlay').style.display = 'none';
  eventToDelete = null;
}

function closeResetModal() {
  document.getElementById('resetModalOverlay').style.display = 'none';
}

function createEvents(title, date, color, repeat, weeklyDays) {
  let events = [];
  let startDate = new Date(date);
  let endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 2); // 2 months ahead

  const intervalValue = parseInt(document.getElementById('intervalValue')?.value || 1);
  const intervalUnit = document.getElementById('intervalUnit')?.value || "days";

  let counter = 0;

  while (startDate <= endDate) {
    let shouldAdd = false;

    if (repeat === "none") shouldAdd = true;
    else if (repeat === "daily") shouldAdd = true;
    else if (repeat === "weekly" && weeklyDays.includes(startDate.getDay())) shouldAdd = true;
    else if (repeat === "biweekly" && counter % 14 === 0) shouldAdd = true;
    else if (repeat === "monthly" && startDate.getDate() === new Date(date).getDate()) shouldAdd = true;
    else if (repeat === "yearly" &&
      startDate.getMonth() === new Date(date).getMonth() &&
      startDate.getDate() === new Date(date).getDate()) shouldAdd = true;
    else if (repeat === "custom" && counter % intervalValue === 0) shouldAdd = true;

    if (shouldAdd) {
      events.push({
        title,
        start: startDate.toISOString().split('T')[0],
        color
      });
    }

    if (repeat === "none") break;

    startDate.setDate(startDate.getDate() + 1);
    counter++;
  }

  // Adjust jumps for custom
  if (repeat === "custom") {
    for (let i = 0; i < events.length; i++) {
      let d = new Date(date);
      if (intervalUnit === "days") d.setDate(d.getDate() + i * intervalValue);
      if (intervalUnit === "weeks") d.setDate(d.getDate() + i * (intervalValue * 7));
      if (intervalUnit === "months") d.setMonth(d.getMonth() + i * intervalValue);
      if (intervalUnit === "years") d.setFullYear(d.getFullYear() + i * intervalValue);
      events[i].start = d.toISOString().split('T')[0];
    }
  }

  return events;
}
