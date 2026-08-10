import { saveFormToDb } from "../services/surveyStore";

function TestInsert() {
  async function insertarFormulario() {
    const formulario = {
      id: crypto.randomUUID(),
      title: "Formulario React",
      slug: `formulario-react-${Date.now()}`,
      description: "Insertado desde React",
      status: "draft",
      surveyJson: {
        title: "Formulario React",
        elements: [
          {
            type: "text",
            name: "nombre",
            title: "Nombre",
          },
        ],
      },
    };

    const resultado = await saveFormToDb(formulario);

    console.log(resultado);

    alert("Formulario guardado");
  }

  return (
    <div>
      <h2>Insertar Formulario</h2>

      <button onClick={insertarFormulario}>
        Guardar en PostgreSQL
      </button>
    </div>
  );
}

export default TestInsert;