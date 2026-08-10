import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-screen">
      <section className="home-panel">
        <p className="eyebrow">Portal administrativo local</p>
        <h1>SurveyUNEFA</h1>
        <p>
          Administra formularios JSON de SurveyJS, publica enlaces y revisa
          respuestas desde Supabase con acceso protegido por roles.
        </p>

        <div className="actions-row">
          <Link className="button primary" to="/admin/forms">
            Abrir administrador
          </Link>
          <Link className="button secondary" to="/login">
            Iniciar sesion
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
