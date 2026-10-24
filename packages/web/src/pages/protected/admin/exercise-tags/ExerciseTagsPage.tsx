import React from 'react';

import type { AdminTag } from '@ffp/core';

import { PageContainer } from '@web/components/atoms';
import { ErrorRetryState, LoadingState, PageHeader } from '@web/components/molecules';
import { DeactivateTagModal, TagCategorySection } from '@web/components/tags';
import { useTagActivation, useTagCategoriesQuery } from '@web/hooks/tags';

/** The tag vocabulary: each category's tags, added, renamed, deactivated and reactivated here */
export const ExerciseTagsPage: React.FC = () => {
  const { data: categories, isPending, refetch } = useTagCategoriesQuery();
  const activation = useTagActivation<AdminTag>();

  return (
    <PageContainer>
      <PageHeader
        title="Exercise Tags"
        subtitle="The words programmes use to find exercises. Add tags as you curate; deactivate one to stop offering it."
      />

      {categories ? (
        <div className="flex flex-col gap-6">
          {categories.map((category) => (
            <TagCategorySection
              key={category.slug}
              category={category}
              onDeactivate={activation.requestDeactivate}
              onReactivate={activation.activate}
              isChangingActivation={activation.isDeactivating || activation.isActivating}
            />
          ))}
        </div>
      ) : isPending ? (
        <LoadingState layout="area" message="Loading tags..." />
      ) : (
        <ErrorRetryState
          title="We couldn't load the tags just now."
          onRetry={() => {
            void refetch();
          }}
        />
      )}

      <DeactivateTagModal
        isOpen={activation.pending !== null}
        onClose={activation.cancelDeactivate}
        onConfirm={activation.confirmDeactivate}
        isLoading={activation.isDeactivating}
        tagLabel={activation.pending?.label ?? ''}
      />
    </PageContainer>
  );
};
