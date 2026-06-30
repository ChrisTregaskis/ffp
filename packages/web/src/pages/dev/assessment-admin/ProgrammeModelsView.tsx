import { useState } from 'react';

import { DemonstrationBanner } from './DemonstrationBanner';
import { ProgrammeModelPanel } from './ProgrammeModelPanel';
import { type Scenario } from './prototype-programmes';
import { ScenarioSelector } from './ScenarioSelector';
import { ViewHeader } from './ViewHeader';

const DEFAULT_SCENARIO: Scenario = {
  level: 2,
  goalId: 'strength',
  focusIds: ['neck_shoulders', 'back_core'],
};

/** How a member's programme is assembled — one shell per level, tagged exercises filling the slots. */
export const ProgrammeModelsView: React.FC = () => {
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);

  return (
    <div>
      <DemonstrationBanner>
        This illustrates how a member&rsquo;s set is assembled from the level shells and tagged
        library. Curate exercises and tags in the Video library; tune an individual&rsquo;s set in
        Member programmes.
      </DemonstrationBanner>

      <ViewHeader
        title="Programme per level + tags"
        subtitle="One shell per level; a member's goal and focus draw tagged exercises into the slots."
      />

      <div className="space-y-5">
        <ScenarioSelector scenario={scenario} onChange={setScenario} />
        <ProgrammeModelPanel scenario={scenario} />
      </div>
    </div>
  );
};
