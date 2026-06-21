import { useMission } from '@libs/stores/mission'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import NumericInput from '@/components/ui/numericInput'
import { getMinTurnRadius } from '@libs/dubins/dubinWaypoints'
import { defaultCopter, defaultPlane } from '@libs/vehicle/defaults'
import { Settings } from 'lucide-react'

export default function VehicleSettingsDialog() {
  const [vehicle, setVehicle] = useMission((s) => [s.vehicle, s.setVehicle])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="w-full">
          <Settings />
          Mission Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-foreground">Mission Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <h3 className="text-foreground text-sm font-medium">Vehicle Type</h3>
          <Tabs value={vehicle.type}>
            <TabsList>
              <TabsTrigger value="Plane" onClick={() => setVehicle(defaultPlane)}>
                Plane
              </TabsTrigger>
              <TabsTrigger value="Copter" onClick={() => setVehicle(defaultCopter)}>
                Copter
              </TabsTrigger>
            </TabsList>

            <TabsContent value="Plane">
              {vehicle.type === 'Plane' ? (
                <div className="flex flex-col gap-4 pt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-foreground text-sm">Cruise Airspeed (m/s)</span>
                      <NumericInput
                        name="Airspeed"
                        value={vehicle.cruiseAirspeed}
                        className="w-full text-foreground"
                        onChange={(x) =>
                          setVehicle(
                            vehicle.type !== 'Plane'
                              ? vehicle
                              : { ...vehicle, cruiseAirspeed: Number(x.target.value) }
                          )
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-foreground text-sm">Max Bank Angle (°)</span>
                      <NumericInput
                        name="Max Bank"
                        value={vehicle.maxBank}
                        className="w-full text-foreground"
                        onChange={(x) =>
                          setVehicle(
                            vehicle.type !== 'Plane'
                              ? vehicle
                              : { ...vehicle, maxBank: Number(x.target.value) }
                          )
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-foreground text-sm">Energy Constant (wh/km)</span>
                      <NumericInput
                        name="Energy Constant"
                        min={0}
                        value={vehicle.energyConstant}
                        className="w-full text-foreground"
                        onChange={(x) =>
                          setVehicle(
                            vehicle.type !== 'Plane'
                              ? vehicle
                              : { ...vehicle, energyConstant: Number(x.target.value) }
                          )
                        }
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Min. turn radius:{' '}
                    {getMinTurnRadius(vehicle.maxBank, vehicle.cruiseAirspeed).toFixed(1)} m
                  </p>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="Copter">
              <p className="text-sm text-muted-foreground pt-3">Coming soon</p>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
