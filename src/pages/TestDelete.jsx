import { deleteFormFromDb } from "../services/surveyStore";

function TestDelete() {
  async function eliminar() {
    const ok = await deleteFormFromDb(
      "11111111-1111-1111-1111-111111111111"
    );

    if (ok) {
      alert("Formulario eliminado");
    }
  }

  return (
    <div>
      <h2>Eliminar Formulario</h2>

      <button onClick={eliminar}>
        Eliminar Encuesta Cliente
      </button>
    </div>
  );
}

export default TestDelete;