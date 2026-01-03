import { useMission } from "@/stores/mission";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import NumericInput from "../ui/numericInput";
import { getMinTurnRadius } from "@libs/dubins/dubinWaypoints";
import { defaultCopter, defaultPlane } from "@libs/vehicle/copter";

export default function MissionDialog() {
  const { vehicle, setVehicle } = useMission()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Settings</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Mission Settings
          </DialogTitle>
        </DialogHeader>
        <div>
          <Tabs value={vehicle.type}>

            <TabsList>
              <TabsTrigger value="Plane" onClick={() => setVehicle(defaultPlane)}>Plane</TabsTrigger>
              <TabsTrigger value="Copter" onClick={() => setVehicle(defaultCopter)}>Copter</TabsTrigger>
            </TabsList>

            <TabsContent value="Plane">
              {vehicle.type == "Plane" ? <>
                <div className="grid grid-cols-2 justify-middle py-4">
                  <label className="flex-col flex w-40 justify-self-center">
                    <span>Cruise Airspeed</span>
                    <NumericInput name="Airspeed" value={vehicle.cruiseAirspeed} className="w-40"
                      onChange={(x) => setVehicle(vehicle.type !== "Plane" ? vehicle : { ...vehicle, cruiseAirspeed: Number(x.target.value) })} />
                  </label>
                  <label className="flex-col flex w-40 justify-self-center">
                    <span>Max Bank Angle</span>
                    <NumericInput name="Max Bank" value={vehicle.maxBank} className="w-40"
                      onChange={(x) => setVehicle(vehicle.type != "Plane" ? vehicle : { ...vehicle, maxBank: Number(x.target.value) })} />
                  </label>
                  <label className="flex-col flex w-40 justify-self-center">
                    <span>Energy Constant (wh/km)</span>
                    <NumericInput name="Energy Constant" min={0} value={vehicle.energyConstant} className="w-40"
                      onChange={(x) => setVehicle(vehicle.type != "Plane" ? vehicle : { ...vehicle, energyConstant: Number(x.target.value) })} />
                  </label>
                </div>
                <div>
                  <span>Minimum turning radius: {getMinTurnRadius(vehicle.maxBank, vehicle.cruiseAirspeed).toFixed(1)}m</span>
                </div>
              </> : null}
            </TabsContent>

            <TabsContent value="Copter">
              <div>Coming Soon</div>
            </TabsContent>

          </Tabs>
        </div >

      </DialogContent>
    </Dialog>
  )
}
