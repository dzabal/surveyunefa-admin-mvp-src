import { useEffect, useState } from "react";
import { getFormsFromDb } from "../services/surveyStore";

function TestSupabase() {
  const [forms, setForms] = useState([]);

  useEffect(() => {
    async function loadForms() {
      const data = await getFormsFromDb();

      console.log("FORMS:", data);

      setForms(data);
    }

    loadForms();
  }, []);

  return (
    <div>
      <h2>Prueba Supabase</h2>

      {forms.map((form) => (
        <div key={form.id}>
          <h3>{form.title}</h3>
          <p>{form.slug}</p>
        </div>
      ))}
    </div>
  );
}

export default TestSupabase;