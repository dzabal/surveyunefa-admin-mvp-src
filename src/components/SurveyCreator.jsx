import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";

function SurveyCreatorPage() {
  const creator = new SurveyCreator();

  return <SurveyCreatorComponent creator={creator} />;
}

export default SurveyCreatorPage;