// DOM Elements
const addUserForm = document.getElementById("addUserForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const roleInput = document.getElementById("role");
const departmentInput = document.getElementById("department");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const usersList = document.getElementById("usersList");
const notificationArea = document.getElementById("notificationArea");

let DB = null;
let sampleUsers = [
  {
    id: 1,
    name: "Sumit Saha",
    email: "sumit@example.com",
    role: "Developer",
    department: "Engineering",
  },
];

function openDatabase(databaseName) {
  return new Promise(function (resolve, reject) {
    let req = indexedDB.open(databaseName, 3);

    req.onerror = function () {
      console.log("find error to open the database");
      reject("Find error to open the database");
    };

    req.onupgradeneeded = function (e) {
      let db = e.target.result;

      // create the table
      if (!db.objectStoreNames.contains("users")) {
        let userObjectStore = db.createObjectStore("users", {
          keyPath: "id",
          autoIncrement: true,
        });

        userObjectStore.createIndex("emailIndex", "email", { unique: true });
      }
    };

    req.onsuccess = function () {
      DB = req.result;

      console.log("database created successfully");
      resolve("Database created successfully");
    };
  });
}

function getAllUsers(objectStoreName) {
  return new Promise(function (resolve, reject) {
    let transaction = DB.transaction([objectStoreName], "readonly");
    let objectStore = transaction.objectStore(objectStoreName);

    let readReq = objectStore.getAll();

    readReq.onsuccess = function () {
      let usersData = readReq.result || [];
      resolve(usersData);
    };

    readReq.onerror = function () {
      reject(readReq.error);
    };
  });
}

function displayAllUsers() {
  return new Promise(function (resolve, reject) {
    getAllUsers("users")
      .then(function (users) {
        resolve(users);
      })
      .catch(function (err) {
        console.log(`Find error to get all users : ${err}`);
        reject(err);
      });
  });
}

/**
 * Show notification on UI
 * @param {string} message - Message to display
 * @param {string} type - Alert type: success, danger, warning, info, primary, secondary, light, dark
 */
function showNotification(message, type = "info") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.setAttribute("role", "alert");
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  notificationArea.appendChild(alertDiv);
  setTimeout(() => {
    alertDiv.remove();
  }, 4000);
}

document.addEventListener("DOMContentLoaded", () => {
  openDatabase("my_db")
    .then(function (result) {
      showNotification(result);
      displayAllUsers().then(function (res) {
        renderUsers(res);
        showNotification("All users showed");
      });
    })
    .catch(function (err) {
      showNotification(err);
    });

  addUserForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const role = roleInput.value.trim();
    const department = departmentInput.value.trim();
    if (!name || !email || !role || !department) {
      showNotification("Please fill in all fields", "warning");
      return;
    }
    const newUser = { id: Date.now(), name, email, role, department };
    sampleUsers.push(newUser);
    renderUsers(sampleUsers);
    addUserForm.reset();
    showNotification("User created successfully!", "success");
    const btn = addUserForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = "User Created!";
    btn.classList.replace("btn-create", "btn-success");
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.replace("btn-success", "btn-create");
    }, 1500);
  });

  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      renderUsers(sampleUsers);
      return;
    }
    const filteredUsers = sampleUsers.filter(
      (u) =>
        u.email.toLowerCase().includes(query) ||
        u.name.toLowerCase().includes(query),
    );
    renderUsers(filteredUsers);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    renderUsers(sampleUsers);
  });

  function renderUsers(users) {
    usersList.innerHTML = "";
    if (users.length === 0) {
      usersList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <p>No users found.</p>
                </div>
            `;
      return;
    }
    users.forEach((user) => {
      const userCard = document.createElement("div");
      userCard.className =
        "user-card d-flex justify-content-between align-items-center";
      userCard.innerHTML = `
                <div>
                    <h5 class="mb-1 text-dark fw-bold">${user.name}</h5>
                    <p class="text-muted mb-1">Email: ${user.email}</p>
                    <p class="text-muted mb-1">Role: ${user.role}</p>
                    <p class="text-muted mb-0">Department: ${user.department}</p>
                </div>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-edit btn-sm" data-id="${user.id}">Edit</button>
                    <button type="button" class="btn btn-delete btn-sm" data-id="${user.id}">Delete</button>
                </div>
            `;
      usersList.appendChild(userCard);
    });
    attachUserButtonListeners();
  }

  function attachUserButtonListeners() {
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.dataset.id);
        const user = sampleUsers.find((u) => u.id === id);
        if (user) {
          fullNameInput.value = user.name;
          emailInput.value = user.email;
          roleInput.value = user.role;
          departmentInput.value = user.department;
          addUserForm.scrollIntoView({ behavior: "smooth" });
          const submitBtn = addUserForm.querySelector('button[type="submit"]');
          const originalText = submitBtn.textContent;
          submitBtn.textContent = "Update User";
          submitBtn.classList.replace("btn-create", "btn-warning");
          const newSubmitBtn = submitBtn.cloneNode(true);
          submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
          newSubmitBtn.addEventListener(
            "click",
            (e) => {
              e.preventDefault();
              user.name = fullNameInput.value.trim();
              user.email = emailInput.value.trim();
              user.role = roleInput.value.trim();
              user.department = departmentInput.value.trim();
              renderUsers(sampleUsers);
              addUserForm.reset();
              showNotification("User updated successfully!", "success");
              newSubmitBtn.textContent = originalText;
              newSubmitBtn.classList.replace("btn-warning", "btn-create");
            },
            { once: true },
          );
        }
      });
    });

    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.dataset.id);
        if (confirm("Are you sure you want to delete this user?")) {
          const index = sampleUsers.findIndex((u) => u.id === id);
          if (index !== -1) {
            sampleUsers.splice(index, 1);
            renderUsers(sampleUsers);
            showNotification("User deleted successfully!", "danger");
          }
        }
      });
    });
  }
});
