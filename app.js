const express = require("express");
let { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

let app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;
let initializingDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server running at http://localhost:3000/`);
    });
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
};

initializingDbAndServer();

// API 1

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let checkUserQuery = `SELECT * FROM USER WHERE username = '${username}';`;
  let checkUserData = await db.get(checkUserQuery);

  if (checkUserData !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let hashedPassWord = await bcrypt.hash(password, 10);
      let userregistrationQuery = `INSERT INTO user 
        (username, name, password, gender, location)
        VALUES ('${username}', '${name}', '${hashedPassWord}', '${gender}', '${location}');`;
      let userRejesterd = await db.run(userregistrationQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

// API 2

app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  let loginUserCheckQuery = `SELECT * FROM user
    WHERE username = '${username}';`;
  let loginUserCheck = await db.get(loginUserCheckQuery);
  if (loginUserCheck === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let passwordMatch = await bcrypt.compare(password, loginUserCheck.password);
    if (passwordMatch === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});

// API 3

app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;
  let userDetailsQuery = `SELECT * FROM user
    WHERE username = '${username}';`;
  let userDetails = await db.get(userDetailsQuery);
  let hasPasswordMatch = await bcrypt.compare(
    oldPassword,
    userDetails.password
  );
  if (hasPasswordMatch === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let hashedNewPassword = await bcrypt.hash(newPassword, 10);
      let updateNewPasswordQuery = `UPDATE user SET password = '${hashedNewPassword}';`;
      await db.run(updateNewPasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});
module.exports = app;
