// Element references
const openModalBtn = document.getElementById('openModalBtn');
const teacherModal = document.getElementById('teacherModal');
const cancelBtn = document.getElementById('cancelBtn');
const nextBtn = document.getElementById('nxtBtn');
const backBtn = document.getElementById('backBtn');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');

// Form fields
const fname = document.getElementById('fullname');
const dob = document.getElementById('dob');
const dept = document.getElementById('dept');
const doj = document.getElementById('doj');
const tid = document.getElementById('teacherid');

// Validation regex
const nameRegex = /^[A-Za-z\s]{3,}$/; // Only letters & spaces, min length 3
const idRegex = /^[0-9]{10}$/; // Exactly 10 digits

// Show Step 1 and hide Step 2
function showStep1() {
  step1.style.display = 'flex';
  step1.style.flexDirection = 'column';
  step2.style.display = 'none';
}

// Show Step 2 and hide Step 1
function showStep2() {
  step1.style.display = 'none';
  step2.style.display = 'flex';
  step2.style.flexDirection = 'column';
  step2.style.alignItems = 'center';
}

// Back button handler
backBtn.addEventListener('click', () => {
  showStep1();
});

// Next button handler
nextBtn.addEventListener('click', (event) => {
  event.preventDefault();
  let hasError = false;

  // Name validation
  if (!nameRegex.test(fname.value.trim())) {
    alert("Please enter a valid name (min 3 letters).");
    hasError = true;
  }

  // ID validation
  if (!idRegex.test(tid.value.trim())) {
    alert("Please enter a valid 10-digit Teacher ID.");
    hasError = true;
  }

  // Proceed if no errors
  if (!hasError) {
    showStep2();
  }
});

// Open modal
openModalBtn.addEventListener('click', () => {
  teacherModal.style.display = 'flex';
  showStep1(); // Always start at step 1
});

// Cancel modal
cancelBtn.addEventListener('click', () => {
  teacherModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
  if (event.target === teacherModal) {
    teacherModal.style.display = 'none';
  }
});
