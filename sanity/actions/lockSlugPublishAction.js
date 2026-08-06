import {useDocumentOperation} from "sanity";
import {slugLockPatch} from "../schemaTypes/slugProtection.js";

export function withPermanentSlugLock(PublishAction) {
  return function PermanentSlugPublishAction(props) {
    const {patch} = useDocumentOperation(props.id, props.type);
    const originalAction = PublishAction(props);
    const lockPatch = slugLockPatch(props.draft, props.published);

    return {
      ...originalAction,
      title: lockPatch ? originalAction.title : "Defina o slug antes de publicar",
      disabled: originalAction.disabled || !lockPatch,
      onHandle: () => {
        patch.execute([lockPatch]);
        originalAction.onHandle();
      },
    };
  };
}
