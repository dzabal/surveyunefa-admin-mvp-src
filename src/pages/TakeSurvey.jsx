import { useParams } from "react-router-dom";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { getPublishedFormBySlug, saveResponse } from "../services/surveyStore";

function TakeSurvey() {
  const { slug } = useParams();
  const form = getPublishedFormBySlug(slug);

  if (!form) {
    return (
      <main className="public-page">
        <section className="empty-state">
          <h1>Formulario no disponible</h1>
          <p>El enlace no existe o el formulario no esta publicado.</p>
        </section>
      </main>
    );
  }

  const survey = new Model(form.surveyJson);

  survey.onComplete.add((sender) => {
    saveResponse(form.id, sender.data);
  });

  return (
    <main className="public-page">
      <section className="survey-container">
        <Survey model={survey} />
      </section>
    </main>
  );
}

export default TakeSurvey;
