# To-Do List Application

A simple, modern, and responsive To-Do List application that helps users organize and manage their daily tasks. Users can add new tasks, edit existing ones, mark tasks as completed, and delete tasks.

The application uses **MySQL** to store tasks permanently, so they remain available even after restarting the server.

## Features

- **Add Tasks:** Create new tasks easily.
- **View Tasks:** Display all saved tasks.
- **Edit Tasks:** Update existing task details.
- **Complete Tasks:** Mark tasks as completed.
- **Delete Tasks:** Remove tasks when they are no longer needed.
- **Persistent Storage:** Store tasks in a MySQL database.
- **Responsive Design:** Clean interface that works across different screen sizes.

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML | Structure of the application |
| CSS | Styling and responsive design |
| JavaScript | Frontend functionality |
| Node.js | Backend runtime |
| Express.js | Server and API development |
| MySQL | Database for storing tasks |

## Project Structure

All files are maintained in a single folder.

```text
To-Do-List/
│
├── index.html
├── style.css
├── script.js
├── server.js
├── database.js
├── package.json
├── .env
└── README.md
```

## Database

**Database Name:** `todo_db`

**Table Name:** `tasks`

| Column | Description |
|---|---|
| id | Unique task ID |
| task_name | Name or description of the task |
| completed | Completion status |
| created_at | Task creation date and time |

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Open the Project Folder

```bash
cd To-Do-List
```

### 3. Create the MySQL Database

Open MySQL Workbench and execute:

```sql
CREATE DATABASE todo_db;
```

### 4. Configure Environment Variables

Create or update the `.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=todo_db
PORT=3000
```

Replace `your_mysql_password` with your own MySQL password.

### 5. Install Dependencies

```bash
npm install
```

### 6. Start the Application

```bash
npm start
```

### 7. Open in Browser

Visit:

```text
http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | Retrieve all tasks |
| POST | `/api/tasks` | Add a new task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

## How It Works

1. The user interacts with the application through the frontend.
2. JavaScript sends requests to the Express.js backend.
3. The backend processes the requests and communicates with MySQL.
4. MySQL stores and retrieves the task information.
5. The updated task list is displayed on the website.

## Learning Outcomes

- Understanding frontend and backend integration.
- Building REST API endpoints using Express.js.
- Connecting a Node.js application to MySQL.
- Performing CRUD operations.
- Handling asynchronous JavaScript requests.
- Managing persistent data using a relational database.

## Author

Developed as a Mini Project to practise full-stack web development using HTML, CSS, JavaScript, Node.js, Express.js, and MySQL.
