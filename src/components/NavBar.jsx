import { Link } from "react-router-dom";

function NavBar() {
  return (
    <div>
      <Link to="/">
        <button>Inicio</button>
      </Link>

      <Link to="/dashboard">
        <button>Dashboard</button>
      </Link>

      <Link to="/new-survey">
        <button>Nueva Encuesta</button>
      </Link>

      <Link to="/results">
        <button>Resultados</button>
      </Link>

      <hr />
    </div>
  );
}

export default NavBar;