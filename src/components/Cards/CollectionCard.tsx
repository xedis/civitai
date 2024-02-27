import { ActionIcon, Badge, Group, Stack, Sx, Text } from '@mantine/core';
import { IconDotsVertical, IconLayoutGrid, IconUser } from '@tabler/icons-react';
import { useCardStyles } from '~/components/Cards/Cards.styles';
import { FeedCard } from '~/components/Cards/FeedCard';
import { CollectionContextMenu } from '~/components/Collections/components/CollectionContextMenu';
import { EdgeMedia } from '~/components/EdgeMedia/EdgeMedia';
import { IconBadge } from '~/components/IconBadge/IconBadge';
import { MediaHash } from '~/components/ImageHash/ImageHash';
import { DEFAULT_EDGE_IMAGE_WIDTH, constants } from '~/server/common/constants';
import { CollectionGetInfinite } from '~/types/router';
import { abbreviateNumber } from '~/utils/number-helpers';
import { MediaType, NsfwLevel as NsfwLevelOld } from '@prisma/client';
import { SimpleUser } from '~/server/selectors/user.selector';
import React from 'react';
import { truncate } from 'lodash-es';
import { ImageMetaProps } from '~/server/schema/image.schema';
import { ImageGuard2 } from '~/components/ImageGuard/ImageGuard2';
import { NsfwLevel } from '~/server/common/enums';

type ImageProps = {
  id: number;
  nsfw: NsfwLevelOld;
  nsfwLevel: NsfwLevel;
  imageNsfw?: boolean;
  postId?: number | null;
  width?: number | null;
  height?: number | null;
  needsReview?: string | null;
  userId?: number;
  user?: SimpleUser;
  url: string;
  type: MediaType;
  name?: string | null;
  meta?: ImageMetaProps | null;
};

export function CollectionCard({ data, sx }: Props) {
  const { classes, cx } = useCardStyles({ aspectRatio: 1 });

  const getCoverImages = () => {
    if (data.image) return [data.image];

    if (data.images) {
      return data.images ?? [];
    }

    return [];
  };

  const getCoverSrcs = () => {
    if (data.image) return [];

    if (data.srcs) {
      return data.srcs ?? [];
    }

    return [];
  };

  const coverImages: ImageProps[] = getCoverImages();
  const coverSrcs: string[] = getCoverSrcs();
  const isMultiImage = coverImages.length !== 0 ? coverImages.length > 1 : coverSrcs.length > 1;
  const coverImagesCount = coverImages.length || coverSrcs.length;
  const contributorCount = data._count?.contributors || data.metrics?.contributorCount || 0;
  const itemCount = data._count?.items || data.metrics?.itemCount || 0;

  return (
    <FeedCard
      className={coverImages.length === 0 ? classes.noImage : undefined}
      href={`/collections/${data.id}`}
      aspectRatio="square"
      // Necessary when inside a UniformGrid
      sx={sx || { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
    >
      <div
        className={cx({
          [classes.root]: true,
          [classes.noHover]: isMultiImage,
        })}
      >
        <div
          className={
            isMultiImage
              ? cx({
                  [classes.imageGroupContainer]: true,
                  [classes.imageGroupContainer4x4]: coverImagesCount > 2,
                })
              : undefined
          }
        >
          {coverImages.length > 0 && (
            <ImageCover data={data} coverImages={coverImages.slice(0, 4)} />
          )}
          {coverSrcs.length > 0 && coverImages.length === 0 && (
            <ImageSrcCover data={data} coverSrcs={coverSrcs} />
          )}
        </div>

        <Stack
          className={cx(classes.contentOverlay, classes.bottom, classes.gradientOverlay)}
          spacing="sm"
        >
          <Group position="apart" align="flex-end" noWrap>
            <Text size="xl" weight={700} lineClamp={2} lh={1.2}>
              {data.name}
            </Text>
            <Group spacing={4} noWrap>
              <IconBadge className={classes.iconBadge} icon={<IconLayoutGrid size={14} />}>
                <Text size="xs">{abbreviateNumber(itemCount)}</Text>
              </IconBadge>
              <IconBadge className={classes.iconBadge} icon={<IconUser size={14} />}>
                <Text size="xs">{abbreviateNumber(contributorCount)}</Text>
              </IconBadge>
            </Group>
          </Group>
        </Stack>
      </div>
    </FeedCard>
  );
}

function CollectionCardHeader({
  data,
  withinImageGuard = true,
}: Props & { withinImageGuard?: boolean }) {
  const { classes, cx } = useCardStyles({ aspectRatio: 1 });

  return (
    <Group spacing={4} position="apart" className={cx(classes.contentOverlay, classes.top)} noWrap>
      <Group spacing="xs">
        {withinImageGuard && <ImageGuard2.BlurToggle className={classes.chip} radius="xl" />}
        <Badge className={cx(classes.infoChip, classes.chip)} variant="light" radius="xl">
          <Text color="white" size="xs" transform="capitalize">
            {data.type ? data.type + 's' : 'Mixed'}
          </Text>
        </Badge>
      </Group>
      <CollectionContextMenu
        collectionId={data.id}
        ownerId={data.userId}
        position="left-start"
        mode={data.mode}
      >
        <ActionIcon
          variant="transparent"
          p={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <IconDotsVertical />
        </ActionIcon>
      </CollectionContextMenu>
    </Group>
  );
}

function ImageCover({ data, coverImages }: Props & { coverImages: ImageProps[] }) {
  const { classes } = useCardStyles({ aspectRatio: 1 });
  const isMultiImage = coverImages.length > 1;
  const coverImagesCount = coverImages.length;
  console.log({ coverImages });

  return (
    <>
      {coverImages.map((image, i) => (
        <ImageGuard2 key={image.id} image={image} connectType="collection" connectId={data.id}>
          {(safe) => (
            <>
              {/* TODO - update  ImageGuard2 to allow blurToggle to be given an image from outside of context */}
              {i === 0 && <CollectionCardHeader data={data} withinImageGuard />}
              {safe ? (
                <EdgeMedia
                  src={image.url}
                  type={image.type}
                  className={classes.image}
                  name={image.name ?? image.id.toString()}
                  alt={
                    image.meta
                      ? truncate(image.meta.prompt, { length: constants.altTruncateLength })
                      : image.name ?? undefined
                  }
                  placeholder="empty"
                  loading="lazy"
                  width={DEFAULT_EDGE_IMAGE_WIDTH}
                  anim={false}
                />
              ) : (
                <MediaHash
                  {...image}
                  style={
                    isMultiImage
                      ? {
                          position: 'relative',
                          width: '50%',
                          height: coverImagesCount > 2 ? '50%' : 'auto',
                        }
                      : {}
                  }
                />
              )}
            </>
          )}
        </ImageGuard2>
      ))}

      {coverImages.length === 0 && (
        <Text color="dimmed" sx={{ width: '100%', height: '100%' }}>
          This collection has no images
        </Text>
      )}
    </>
  );
}

function ImageSrcCover({ data, coverSrcs }: Props & { coverSrcs: string[] }) {
  const { classes } = useCardStyles({ aspectRatio: 1 });

  return (
    <>
      {coverSrcs.map((src) => (
        <EdgeMedia
          src={src}
          width={DEFAULT_EDGE_IMAGE_WIDTH}
          placeholder="empty"
          className={classes.image}
          loading="lazy"
          key={src}
          anim={false}
        />
      ))}
      <CollectionCardHeader data={data} withinImageGuard={false} />
    </>
  );
}

type Props = {
  data: Omit<CollectionGetInfinite[number], 'image'> & {
    metrics?: {
      itemCount: number;
      contributorCount: number;
    } | null;
    srcs?: string[] | null;
    images?: ImageProps[] | null;
  } & {
    image?: ImageProps | null;
  };
  sx?: Sx;
};
