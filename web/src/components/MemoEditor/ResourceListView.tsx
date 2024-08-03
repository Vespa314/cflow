import { DndContext, closestCenter, MouseSensor, TouchSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Resource } from "@/types/proto/api/v2/resource_service";
import Icon from "../Icon";
import ResourceIcon from "../ResourceIcon";
import SortableItem from "./SortableItem";
import {getResourceUrl} from "../../utils/resource"
import showRenameImageDialog from "../ImageRenameDialag"
import { useResourceStore } from "../../store/module";

interface Props {
  resourceList: Resource[];
  setResourceList: (resourceList: Resource[]) => void;
}

const ResourceListView = (props: Props) => {
  const { resourceList, setResourceList} = props;
  const resourceStore = useResourceStore();

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 0.01
    }
  })
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), pointerSensor);

  const handleDeleteResource = async (resourceId: ResourceId) => {
    setResourceList(resourceList.filter((resource) => resource.id !== resourceId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = resourceList.findIndex((resource) => resource.id === active.id);
      const newIndex = resourceList.findIndex((resource) => resource.id === over.id);
      setResourceList(arrayMove(resourceList, oldIndex, newIndex));
    }
  };

  const handleUpdateResourceName = async (resource: Resource) => {
    showRenameImageDialog(resource.filename, getResourceUrl(resource), async (new_name) => {
      await resourceStore.updateResourceName(resource.id, new_name);
      setResourceList(resourceList.map((r) => {
        if (r.id === resource.id) {
          return {
            ...r,
            filename: new_name
          }
        }
        return r;
      }))
    })
};

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={resourceList.map((resource) => resource.id)} strategy={verticalListSortingStrategy}>
        {resourceList.length > 0 && (
          <div className="w-full flex flex-row justify-start flex-wrap gap-2 mt-2">
            {resourceList.map((resource, index) => {
              return (
                <div key={resource.id} className="max-w-full flex flex-row justify-start items-center flex-nowrap gap-x-1 bg-gray-100 px-2 py-1 rounded text-gray-500">
                <SortableItem id={resource.id} className="flex flex-row justify-start items-center gap-x-1" >
                  <ResourceIcon resource={resource} className="!w-4 !h-4 !opacity-100" />
                  <span className="text-sm max-w-[8rem] truncate" onDoubleClick={() => handleUpdateResourceName(resource)}>{resource.filename}</span>
                </SortableItem>
                <Icon.X
                  className="w-4 h-auto cursor-pointer opacity-60 hover:opacity-100"
                  onClick={() => handleDeleteResource(resource.id)}
                />
                </div>
              );
            })}
          </div>
        )}
      </SortableContext>
    </DndContext>
  );
};

export default ResourceListView;
