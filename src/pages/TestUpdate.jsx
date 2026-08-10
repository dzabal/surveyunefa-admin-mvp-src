import { updateFormInDb } from "../services/surveyStore";

function TestUpdate() {
  async function actualizar() {
    const resultado = await updateFormInDb(
      "bafaaaa8-594f-4e65-98ee-bdb5b5342cbb",
      {
        title: "Formulario React Actualizado",
        status: "published",
      }
    );

    console.log(resultado);

    alert("Formulario actualizado");
  }

  return (
    <div>
      <h2>Actualizar Formulario</h2>

      <button onClick={actualizar}>
        Actualizar
      </button>
    </div>
  );
}

export default TestUpdate;