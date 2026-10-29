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

// Edit modal elements
const editUserModalEl = document.getElementById("editUserModal");
const editUserModal = new bootstrap.Modal(editUserModalEl);
const editUserIdInput = document.getElementById("editUserId");
const editFullNameInput = document.getElementById("editFullName");
const editEmailInput = document.getElementById("editEmail");
const editRoleInput = document.getElementById("editRole");
const editDepartmentInput = document.getElementById("editDepartment");
const saveEditBtn = document.getElementById("saveEditBtn");

let DB = null;
let users = [];

function addUser(user) {
  return new Promise(function (resolve, reject) {
    const transaction = DB.transaction(["users"], "readwrite");
    const writeReq = transaction.objectStore("users").add(user);

    transaction.oncomplete = resolve;
    transaction.onerror = function () {
      reject(transaction.error || writeReq.error);
    };
    transaction.onabort = function () {
      reject(transaction.error || writeReq.error);
    };
  });
}

function updateUser(user) {
  return new Promise(function (resolve, reject) {
    const transaction = DB.transaction(["users"], "readwrite");
    const writeReq = transaction.objectStore("users").put(user);

    transaction.oncomplete = resolve;
    transaction.onerror = function () {
      reject(transaction.error || writeReq.error);
    };
    transaction.onabort = function () {
      reject(transaction.error || writeReq.error);
    };
  });
}

function deleteUser(id) {
  return new Promise(function (resolve, reject) {
    const transaction = DB.transaction(["users"], "readwrite");
    const deleteReq = transaction.objectStore("users").delete(id);

    transaction.oncomplete = resolve;
    transaction.onerror = function () {
      reject(transaction.error || deleteReq.error);
    };
    transaction.onabort = function () {
      reject(transaction.error || deleteReq.error);
    };
  });
}

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

/**
 * Print the user id to the console
 * @param {number} id - User id
 */
function printUserId(id) {
  console.log("User ID:", id);
}

document.addEventListener("DOMContentLoaded", () => {
  openDatabase("my_db")
    .then(function (result) {
      showNotification(result);
      return displayAllUsers();
    })
    .then(function (loadedUsers) {
      users = loadedUsers;
      renderUsers(users);
      showNotification("All users showed");
    })
    .catch(function (error) {
      showNotification(error.message || error, "danger");
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

    addUser(newUser)
      .then(() => displayAllUsers())
      .then((loadedUsers) => {
        users = loadedUsers;
        renderUsers(users);
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
      })
      .catch((error) => {
        showNotification(error.message || "Failed to add user", "danger");
      });
  });

  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      renderUsers(users);
      return;
    }
    const filteredUsers = users.filter(
      (u) =>
        u.email.toLowerCase().includes(query) ||
        u.name.toLowerCase().includes(query),
    );
    renderUsers(filteredUsers);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    renderUsers(users);
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
  }

  usersList.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-id]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const user = users.find((item) => item.id === id);
    if (!user) return;

    if (button.classList.contains("btn-edit")) {
            printUserId(id);
            editUserIdInput.value = user.id;
            editFullNameInput.value = user.name;
            editEmailInput.value = user.email;
            editRoleInput.value = user.role;
            editDepartmentInput.value = user.department;
            editUserModal.show();
            return;
    }

    if (
            button.classList.contains("btn-delete") &&
            confirm("Are you sure you want to delete this user?")
    ) {
            deleteUser(id)
              .then(() => displayAllUsers())
              .then((loadedUsers) => {
                users = loadedUsers;
                renderUsers(users);
                showNotification("User deleted successfully!", "success");
              })
              .catch((error) => {
                showNotification(error.message || "Failed to delete user", "danger");
              });
    }
  });

  saveEditBtn.addEventListener("click", () => {
    const id = Number(editUserIdInput.value);
    const user = users.find((item) => item.id === id);
    const name = editFullNameInput.value.trim();
    const email = editEmailInput.value.trim();
    const role = editRoleInput.value.trim();
    const department = editDepartmentInput.value.trim();

    if (!user) {
            showNotification("User not found", "warning");
            return;
    }
    if (!name || !email || !role || !department) {
            showNotification("Please fill in all fields", "warning");
            return;
    }

    updateUser({ ...user, name, email, role, department })
            .then(() => displayAllUsers())
            .then((loadedUsers) => {
              users = loadedUsers;
              renderUsers(users);
              editUserModal.hide();
              showNotification("User updated successfully!", "success");
            })
            .catch((error) => {
              showNotification(error.message || "Failed to update user", "danger");
            });
  });
});
