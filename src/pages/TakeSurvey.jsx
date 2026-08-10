import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { getPublishedFormBySlug, saveResponse } from "../services/surveyStore";

function TakeSurvey() {
  const { slug } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadPublicForm() {
      setLoading(true);
      setError("");

      try {
        setForm(await getPublishedFormBySlug(slug));
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar el formulario.");
      } finally {
        setLoading(false);
      }
    }

    loadPublicForm();
  }, [slug]);

  const survey = useMemo(() => {
    if (!form) {
      return null;
    }

    const model = new Model(form.surveyJson);
    model.onComplete.add(async (sender) => {
      try {
        await saveResponse(form.id, sender.data);
        setSubmitted(true);
      } catch (saveError) {
        setError(saveError.message || "No se pudo guardar la respuesta.");
      }
    });

    return model;
  }, [form]);

  if (loading) {
    return (
      <main className="public-page">
        <section className="empty-state">
          <h1>Cargando formulario</h1>
          <p>Un momento.</p>
        </section>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="public-page">
        <section className="empty-state">
          <h1>Formulario no disponible</h1>
          <p>El enlace no existe o el formulario no esta publicado.</p>
          {error ? <p className="form-message error">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="public-page">
      {error ? <p className="form-message error">{error}</p> : null}
      {submitted ? (
        <section className="empty-state">
          <h1>Respuesta registrada</h1>
          <p>Gracias por completar el formulario.</p>
        </section>
      ) : (
        <section className="survey-container">
          <Survey model={survey} />
        </section>
      )}
    </main>
  );
}

export default TakeSurvey;
