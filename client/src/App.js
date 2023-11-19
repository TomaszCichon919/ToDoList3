import { useEffect, useState } from "react";
import io from 'socket.io-client';
import shortid from 'shortid';

const App = () => {

  const [socket, setSocket] = useState();
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [editTaskId, setEditTaskId] = useState(null);

  const updateTasks = (updatedTasks) => {
    setTasks(updatedTasks);
  }


  const addTask = (task) => {
    setTasks((tasks) => [...tasks, task]);
  }

  const removeTask = (id, emitToServer) => {
    setTasks(tasks => tasks.filter(task => task.id !== id));
    if (emitToServer) {
      socket.emit('removeTask', id);
    }
  };

  const editTask = (id, newName) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === id ? { ...task, name: newName } : task
      );
      return updatedTasks;
    });
  };

  const submitForm = (e) => {
    e.preventDefault();

    if (editTaskId !== null) {
      editTask(editTaskId, taskName);
      socket.emit('editTask', editTaskId, taskName);
      setEditTaskId(null);
      setTaskName('');
    } else {
      const newTask = { id: shortid.generate(), name: taskName }
      addTask(newTask);
      socket.emit('addTask', newTask);
      setTaskName('');
    }
  };

  const handleEditClick = (id) => {
    setEditTaskId(id);
    const taskToEdit = tasks.find((task) => task.id === id);
    if (taskToEdit) {
      setTaskName(taskToEdit.name);
    }
  };

  useEffect(() => {
    const socket = io('ws://localhost:8000', { transports: ['websocket'] });
    setSocket(socket);

    socket.on('updateData', (updatedTasks) => {
      updateTasks(JSON.parse(updatedTasks));
    });

    socket.on('removeTask', (taskId) => {
      removeTask(taskId, false);
    });


    socket.on('addTask', (newTask) => {
      addTask(newTask);
    });

    socket.on('editTask', (id, newName) => {
      editTask(id, newName);
    });

    return () => {
      socket.disconnect();
    };
  }, []);


  return (
    <div className="App">

      <header>
        <h1>ToDoList.app</h1>
      </header>

      <section className="tasks-section" id="tasks-section">
        <h2>Tasks</h2>

        <ul className="tasks-section__list" id="tasks-list">
          {tasks.map(item => (
            <li key={item.id} className="task">
              <button onClick={() => handleEditClick(item.id)} className="btn btn--blue">
                Edit
              </button>
              {item.name} <button onClick={() => removeTask(item.id, true)} className="btn btn--red">Remove</button>
            </li>
          ))}
        </ul>

        <form id="add-task-form" onSubmit={submitForm}>
          <input onChange={e => setTaskName(e.target.value)} value={taskName} className="text-input" autoComplete="off" type="text" placeholder="Type your description" id="task-name" />
          <button className="btn" type="submit">   {editTaskId !== null ? 'Edit' : 'Add'} </button>
        </form>

      </section>
    </div>
  );
}

export default App;