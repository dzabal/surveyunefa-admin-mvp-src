import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error no controlado en React.", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="auth-screen">
          <section className="auth-panel">
            <p className="eyebrow">Error de aplicacion</p>
            <h1>No pudimos mostrar esta pantalla</h1>
            <p>
              Recarga la pagina. Si el error se repite, revisa la consola y la
              configuracion de Supabase.
            </p>
            <button
              className="button primary"
              type="button"
              onClick={() => window.location.reload()}
            >
              Recargar
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
