const openModalBtn = document.getElementById('openModalBtn');
const teacherModal = document.getElementById('teacherModal');
const cancelBtn = document.getElementById('cancelBtn');
const nextBtn = document.getElementById('nxtBtn');
const backBtn = document.getElementById('backBtn');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');

const fname = document.getElementById('fullname');
const dob = document.getElementById('dob');
const dept = document.getElementById('dept');
const doj = document.getElementById('doj');
const tid = document.getElementById('teacherid');
const genderSelect = document.getElementById('gender');


const nameRegex = /^[A-Za-z\s]{3,}$/; 
const idRegex = /^[0-9]{10}$/; 

//to toggle between menu1 and menu2
function showStep1() {
  step1.style.display = 'flex';
  step1.style.flexDirection = 'column';
  step2.style.display = 'none';
}
function showStep2() {
  step1.style.display = 'none';
  step2.style.display = 'flex';
  step2.style.flexDirection = 'column';
  step2.style.alignItems = 'center';
}

backBtn.addEventListener('click', () => {
  showStep1();
});

nextBtn.addEventListener('click', (event) => {
  event.preventDefault();
  let hasError = false;

  //validating full name
  if (!nameRegex.test(fname.value.trim())) {
    alert("Please enter a valid name (min 3 letters).");
    hasError = true;
  }

  //validating teacher ID
  if (!idRegex.test(tid.value.trim())) {
    alert("Please enter a valid 10-digit Teacher ID.");
    hasError = true;
  }


  if (!hasError) {
    showStep2();
  }
});


openModalBtn.addEventListener('click', () => {
  teacherModal.style.display = 'flex';
  showStep1(); 
});


cancelBtn.addEventListener('click', () => {
  teacherModal.style.display = 'none';
});


window.addEventListener('click', (event) => {
  if (event.target === teacherModal) {
    teacherModal.style.display = 'none';
  }
});
//to check password strength
function checkPasswordStrength(password) {
    const strongRegex =  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{9,}$/;

    if (!strongRegex.test(password)) {
      return false;
    }
    return true;
  }
document.getElementById("addTeacherBtn").addEventListener("click", async function (e) {
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      e.preventDefault(); //Stops form submission
      return;
    }

    if (!checkPasswordStrength(password)) {
      alert("Weak password! Must be at least 8 characters and include uppercase, lowercase, number, and special character.");
      e.preventDefault(); 
      return;
    }
    const selectedGender = genderSelect.value;
    const teacherData = {
      name: fname.value.trim(),
      dob: dob.value.trim(),
      department: dept.value.trim(),
      joiningDate: doj.value.trim(),
      userId: tid.value.trim(),
      password: password,
      gender: selectedGender,
      role: "Teacher"
    };

  //Send data to the server
  try {
    const response = await fetch("/coe/addTeacher", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(teacherData)
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add teacher");
      throw new Error(data.message || "Failed to add teacher");
    }

    alert(data.message || "Teacher added successfully!");
    teacherModal.style.display = 'none';
  } catch (error) {
    console.error("Error:", error);
  }
  });

  //toggle password visibilty
  document.getElementById('showPassword').addEventListener('change', function () {
  const passwordField = document.getElementById('password');
  passwordField.type = this.checked ? 'text' : 'password';
});

//toggle confirm password visibility
document.getElementById('showConfirmPassword').addEventListener('change', function () {
  const confirmPasswordField = document.getElementById('confirmPassword');
  confirmPasswordField.type = this.checked ? 'text' : 'password';
});
