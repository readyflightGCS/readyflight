import { useEditorStore } from "@/stores/configurator"

export default function Settings() {
  const { currentTab } = useEditorStore()
  return (
    <div>
      I am settings :)
    </div>
  )
}
