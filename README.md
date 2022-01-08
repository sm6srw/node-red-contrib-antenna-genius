# node-red-contrib-antenna-genius
Antenna Genius Control and Monitoring Nodes

![image](https://user-images.githubusercontent.com/7033002/148573983-00305f15-7acf-4d4d-bb1f-9c820c4b3a79.png) ![image](https://user-images.githubusercontent.com/7033002/148489672-9e2c03e0-a968-4c2f-9dc7-923c5423fad7.png)

![image](https://user-images.githubusercontent.com/7033002/148574085-f0705a9c-7ac8-4ca0-b96a-ea7a14975d87.png)

## antenna-genius-band-labels

Returns the current band labels for radio A and radio B.

### Properties

`Server (antenna genius server)`: select antenna genius server to use.

### Outputs

`payload.bandLabelA (string)`: is the current band for Radio A as a string. For example `12m`.

`payload.bandLabelB (string)`: is the current band for Radio B as a string. For example `10m`.

## antenna-genius-antenna-status

### Properties

`Server (antenna genius server)`: select antenna genius server to use.

`Antenna Number (integer)`: Antenna number to get status for. Valid values are from 1 up to 32 (8 for one, 16 for two, 24 for three and 32 for four interconnected Antenna Geniuses).

### Outputs

Port 1: Status for Radio A antenna.

`payload.selected (boolean)`: this is the currently selected antenna for Radio A on the current band. 

`payload.enabled (boolean)`: this antenna can be selected for use by Radio A on the current band.

`payload.name (string )`: the name of this antenna.

`payload.background (string)`: the suggested background color for the current antenna state.

`enabled (boolean)`: same as `payload.enabled`.

`topic (string)`: string that can be used to activate this antenna using the `activate-antenna` node.

Port 2: Status for Radio A antenna.

`payload.selected (boolean)`: this is the currently selected antenna for Radio B on the current band. 

`payload.enabled (boolean)`: this antenna can be selected for use by Radio B on the current band.

`payload.name (string )`: the name of this antenna.

`payload.background (string)`: the suggested background color for the current antenna state.

`enabled (boolean)`: same as `payload.enabled`.

`topic (string)`: string that can be used to activate this antenna using the `activate-antenna` node.

### Details

A typical workflow is to feed each output to a `button` and then map `payload.name` to the button`s `label`, and `payload.background` to the button`s `background`. Set the buttons `payload` to `true` and `Topic` to `msg.topic` when clicked and everything is setup to directly feed an `activate-antenna` node.

## antenna-genius-activate-antenna

Set the antenna defined in topic as active.

### Properties

`Server (antenna genius server)`: select antenna genius server to use.

### Inputs

`topic (string)`: Selection string for antenna. For example `"1;5"` for Radio A, antenna 5.

### Details

See the `antenna-status`: node for more information.

## antenna-genius-server

Antenna Genius shared connection configuration.

### Configuration

`Host (string)`: Antenna Genius host name or IP address.

`Port (integer)`: Antenna Genius port number.

`Disabled Background (string)`: Background color to use for an antenna that is disabled.

`Active Background (string)`: Background color to use for an antenna that is active (e.g. can be selected).

`Selected Background (string)`: Background color to use for and antenna that is selected.
