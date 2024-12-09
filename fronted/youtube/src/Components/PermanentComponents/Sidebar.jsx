import React from "react";
import contants from "../constants.js"
import SidebarElementButton from "../index.js";


function Sidebar() {
  return (
    <div className="group fixed inset-x-0 bottom-0 z-40 w-full shrink-0 border-t border-white bg-[#121212] px-2 py-2 sm:absolute sm:inset-y-0 sm:max-w-[70px] sm:border-r sm:border-t-0 sm:py-6 sm:hover:max-w-[250px] lg:sticky lg:max-w-[250px]">


        <ul className="flex justify-around gap-y-2 sm:sticky sm:top-[106px] sm:min-h-[calc(100vh-130px)] sm:flex-col">


          {sideBarElement?.map((cur) => (
            <SidebarElementButton
              key={cur.id}
              title={cur.title}
              svg={cur.svg}
            />
          ))}

          <SidebarElementButton
            title={"Setting"}
            svg={"./Logo/support.svg"}
            className={"hidden sm:block mt-auto"}
          />

          <SidebarElementButton
            title={"Support"}
            svg={"./Logo/support.svg"}
            className={"hidden sm:block"}
          />
        </ul>
      </div>
  );
}

export default Sidebar;
