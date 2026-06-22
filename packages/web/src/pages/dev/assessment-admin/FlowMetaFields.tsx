import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';

export interface FlowMetaValues {
  name: string;
  description: string;
}

/** Name + description fields for the flow metadata form. */
export const FlowMetaFields: React.FC = () => {
  const { register, errors } = useComposableFormContext<FlowMetaValues>();

  return (
    <>
      <FormTextInput
        name="name"
        label="Flow name"
        placeholder="e.g. Wellness baseline"
        register={register}
        errors={errors}
        isRequired
        registerOptions={{ required: 'Please give the flow a name' }}
      />
      <FormTextarea
        name="description"
        label="Description"
        placeholder="What is this assessment for?"
        register={register}
        errors={errors}
        rows={3}
      />
    </>
  );
};
