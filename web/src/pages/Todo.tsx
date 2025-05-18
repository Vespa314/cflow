import { useEffect, useState } from "react";
import { Switch } from "@mui/joy";
import MemoList from "@/components/MemoList";
import { useFilterStore } from "@/store/module";
import MobileHeader from "@/components/MobileHeader";

const Todo = () => {
  const filterStore = useFilterStore();
  const [onlyShowUnfinish, setOnlyShowUnfinish] = useState(true);

  const handleShowAllChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setOnlyShowUnfinish(event.target.checked);
  };

  useEffect(() => {
    if(onlyShowUnfinish) {
      filterStore.setTextFilter("$unfinish$")
    }
    else {
      filterStore.setTextFilter("$todo$")
    }
  }, [onlyShowUnfinish]);

  return (
    <section className="@container w-full max-w-3xl min-h-full flex flex-col justify-start items-center px-4 sm:px-2 sm:pt-4 pb-8 bg-zinc-100 dark:bg-zinc-800">
      <MobileHeader />
      <div className="w-full flex flex-row justify-start items-start">
        <div className="w-full px-4 4 sm:px-2 sm:pt-4">
          <span className="flex mx-1 w-full">
            <span>只看未完成：</span>
            <Switch className="ml-2" checked={onlyShowUnfinish} onChange={handleShowAllChanged} />
          </span>
          <MemoList showFilterDesc={false} />
        </div>
      </div>
    </section>
  );
};

export default Todo;
