import { Helmet } from 'react-helmet-async';
import { twMerge } from 'tailwind-merge';
import fetchMock from 'fetch-mock';
import { ChangeEvent, useCallback, useContext, useRef, useState } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { Icon } from '@iconify-icon/react';
import { Button, ButtonOutline, ButtonPrimary } from '@/components/Button.tsx';
import { cropImage, CropParams, fixImageOrientation } from '@/utils/image.ts';
import BusyScreen from '@/components/BusyScreen.tsx';
import { setProfilePicture } from '@/services/profile.ts';
import { ProfileSetupStep, WizardContext } from '@/contexts/ProfileSetupWizardContext.ts';
import { Slider } from '@mui/material';

function ProfilePictureEditor({ src, onApply, onCancel }: {
  // Image source url
  src?: string;
  onApply?: (blob: Blob) => void;
  onCancel?: () => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const avatarCropParam = useRef<CropParams>();

  const onCropComplete = (_newCroppedArea: Area, newCroppedAreaPixels: Area) => {
    avatarCropParam.current = {
      ...newCroppedAreaPixels,
      rotation,
    };
  };

  const handleConfirm = async () => {
    if (!src) throw new Error('No crop image source');

    if (onApply) {
      const imageBlob = await cropImage(src, avatarCropParam.current);
      if (!imageBlob) throw new Error('No crop result returned');

      onApply(imageBlob);
    }
  };

  const handleSliderChange = (_evt: Event, val: number | number[]) => setZoom(val as number);

  return (
    <section className="flex flex-col gap-8 items-center justify-center w-full h-svh overflow-hidden">
      <div className="relative h-full max-h-[512px] w-full overflow-visible" data-testid="cropper-container">
        <Cropper
          image={src}
          crop={crop}
          rotation={rotation}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onRotationChange={setRotation}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: {
              overflow: 'visible',
            },
          }}
        />
      </div>
      <div className="flex gap-6 w-full max-w-[300px] items-center isolate">
        <Icon icon="gg:zoom-in" width="24" className="text-white" />
        <Slider aria-label="Zoom" value={zoom} min={1} max={3} step={0.05} onChange={handleSliderChange} />
        <Icon icon="gg:zoom-out" width="24" className="text-white" />
      </div>
      <div className="flex flex-col gap-2 w-full max-w-64 my-6 z-10 justify-items-stretch content-center">
        <ButtonPrimary
          className="outline-white outline-offset-0"
          onClick={handleConfirm}
        >
          Confirm
        </ButtonPrimary>
        <Button
          className="bg-neutral-100 outline-offset-0"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </section>
  );
}

function ProfilePicturePreview({ src, className, ...otherProps }: {
  src?: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <section data-testid="avatar_preview" className={twMerge('aspect-square', className)} role="button" {...otherProps}>
      <div className="rounded-full w-full aspect-square overflow-hidden flex items-center justify-center border-4 border-white">
        <img
          src={src ? src : '/assets/images/profile-picture-blank.jpg'}
          alt="Preview of profile picture"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-0 right-0 w-1/4 box-border p-3 aspect-square bg-primary border-2 border-white rounded-full flex items-center justify-center">
        <Icon icon="ph:camera" className="w-full text-white" width="unset" />
      </div>
    </section>
  );
}

export function ProfileSetupProfilePictureForm(props: {
  previewUrl?: string;
  onFileSelect?: (e: File) => void;
  onSubmit?: (promise: ReturnType<typeof setProfilePicture>) => void;
  onSkip?: () => void;
}) {
  const { onSubmit, previewUrl } = props;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const triggerChooseFile = () => fileInputRef?.current?.click?.();

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      props.onFileSelect?.(e.target.files[0]);
    }
  };

  return (
    <>
      <ProfilePicturePreview
        src={previewUrl}
        className="relative w-full max-w-[224px]"
        onClick={triggerChooseFile}
      />
      <h1 className="my-6 font-semibold text-lg text-neutral-700 text-center">Set Profile Picture</h1>
      <div className="flex flex-col gap-1 w-1/2">
        <ButtonOutline
          leftIcon="uil:image-upload"
          className="w-full text-primary"
          onClick={triggerChooseFile}
        >
          {!props.previewUrl ? 'Choose File' : 'Change Picture'}
        </ButtonOutline>
        {
          props.previewUrl && (
            <ButtonPrimary
              leftIcon="mdi:arrow-right"
              className="w-full"
              onClick={onSubmit}
            >
              Continue
            </ButtonPrimary>
          )
        }
        <Button
          className="w-full"
          onClick={props.onSkip}
        >
          Skip
        </Button>
        <input
          ref={fileInputRef}
          data-testid="file_input"
          type="file"
          className="hidden"
          accept=".jpg, .jpeg, image/png, image/webp, image/avif"
          onChange={handleFileInputChange}
        />
      </div>
    </>
  );
}

export default function ProfileSetupProfilePicture() {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFileSrc, setImageFileSrc] = useState<string>();
  const [isCropEditorVisible, setIsCropEditorVisible] = useState<boolean>(false);
  const croppedImage = useRef<Blob>();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>();

  const wizardController = useContext(WizardContext);

  /**
   * Show cropper if `url` is a `string`. Hide cropper when `url` is `undefined`
   * @param {string} [url]
   */
  const showCropper = (url?: string) => {
    setImageFileSrc(url);
    setIsCropEditorVisible(!!url);
  };

  const hideCropper = useCallback(() => showCropper(undefined), []);

  const handleFileSelect = useCallback((file: File) => {
    setIsLoading(true);
    void fixImageOrientation(file)
      .then((url) => {
        if (url) showCropper(url);
        return;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleCropConfirm = useCallback((blob: Blob) => {
    croppedImage.current = blob;

    // Generate object url for newly cropped image
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(blob));

    // Hide cropper
    hideCropper();
    return;
  }, [hideCropper, imagePreviewUrl]);

  const goToNextStep = useCallback(() => wizardController?.setCurrentStep?.(ProfileSetupStep.STEP_COMPLETE), [wizardController]);

  const handleSubmitResponse = useCallback(() => {
    setIsLoading(true);

    // Mock request response
    fetchMock.post(
      {
        url: `express:/api/profile/:profileId/picture`,
      },
      {
        status: 200,
        body: {
          success: true,
          data: {
            src: 'profilepicture.png',
          },
        },
        headers: {
          'Content-Type': 'application/json',
        },
      },
      { delay: 1000 },
    );

    if (!croppedImage.current) {
      throw new Error('No image data to submit');
    }

    setProfilePicture({
      profileId: '1234',
      image: croppedImage.current,
    })
      .then((res) => {
        if (res.success) {
          // Profile picture src is in res.data.src
          // Proceed to next step if success
          goToNextStep();
        }
        return;
      })
      .catch((err: Error) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
        fetchMock.restore();
      });
  }, [goToNextStep]);

  return (
    <>
      <Helmet>
        <title>Profile Picture</title>
      </Helmet>
      {
        isLoading && (
          <section className="flex items-center justify-center w-full h-svh">
            <BusyScreen />
          </section>
        )
      }
      {
        isCropEditorVisible && !isLoading && (
          <ProfilePictureEditor
            src={imageFileSrc}
            onCancel={hideCropper}
            onApply={handleCropConfirm}
          />
        )
      }
      {
        !isCropEditorVisible && !isLoading && (
          <section className="flex justify-center items-center min-h-svh mx-auto px-4 py-12 max-w-md md:max-w-sm md:px-0 md:w-96 sm:px-4">
            <section className="flex flex-col items-center justify-center w-full">
              <ProfileSetupProfilePictureForm
                previewUrl={imagePreviewUrl}
                onFileSelect={handleFileSelect}
                onSubmit={handleSubmitResponse}
                onSkip={goToNextStep}
              />
            </section>
          </section>
        )
      }
    </>
  );
}
