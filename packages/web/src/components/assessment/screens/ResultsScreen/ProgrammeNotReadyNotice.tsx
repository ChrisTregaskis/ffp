import { Icons } from '@web/components/atoms';
import { StatusResult } from '@web/components/molecules';

/** Shown in place of the programme button when the programme could not be put together */
export const ProgrammeNotReadyNotice: React.FC = () => (
  <StatusResult
    icon={Icons.CLOCK}
    iconVariant="primary"
    title="Your programme is not quite ready"
    titleAs="h3"
    description="We couldn't put it together just now. Your results are saved, so please check back with us soon."
    spacing="compact"
  />
);
