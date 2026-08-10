import { useEffect, useState } from "react";
import { getFormByIdFromDb } from "../services/surveyStore";

function TestFormById() {
  const [form, setForm] = useState(null);

  useEffect(() => {
    async function loadForm() {
      const data = await getFormByIdFromDb(
        "11111111-1111-1111-1111-111111111111"
      );

      console.log(data);

      setForm(data);
    }

    loadForm();
  }, []);

  if (!form) {
    return <h2>Cargando...</h2>;
  }

  return (
    <div>
      <h2>{form.title}</h2>
      <p>{form.slug}</p>
      <p>{form.status}</p>
    </div>
  );
}

export default TestFormById;