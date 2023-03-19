const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// API-1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUsernameQuery = `
        SELECT * FROM user WHERE username='${username}';
    `;
  const dbUsername = await db.get(getUsernameQuery);

  const passwordLen = password.length;
  if (passwordLen < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (dbUsername !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    const createUserQuery = `
        INSERT INTO
            user (username, name, password, gender, location)
        VALUES
            (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'  
            );`;
    await db.run(createUserQuery);
    response.status(200);
    response.send("User created successfully");
  }
});

//API-2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUsernameQuery = `
          SELECT * FROM user WHERE username='${username}';
      `;
  const dbUsername = await db.get(getUsernameQuery);
  if (dbUsername === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUsername.password);
    if (isPasswordMatch) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API-3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUsernameQuery = `
        SELECT * FROM user WHERE username='${username}';
    `;
  const dbUsername = await db.get(getUsernameQuery);
  const isPasswordMatch = await bcrypt.compare(
    oldPassword,
    dbUsername.password
  );

  const passwordLen = newPassword.length;
  if (isPasswordMatch === false) {
    response.status(400);
    response.send("Invalid current password");
  } else if (passwordLen < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatePasswordQuery = `
          UPDATE user
          SET
          password='${hashedPassword}'
          WHERE username='${username}';
      `;
    await db.run(updatePasswordQuery);
    response.status(200);
    response.send("Password updated");
  }
});

module.exports = app;
