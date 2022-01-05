const encode = (protocol, method, command, revision, payload) => {
    // !llll!bbbbbb!payload
    // llll id the length, in hex of bit header, bbbbbb, and the payload, based on zero. 
    // bbbbbb
    // gscph.protocol = 0xe00000 // 3 bits Protocol version
    // gscph.method   = 0x180000 // 2 bits 0 = Unicast request, 1 = Unicast response, 2 = Broadcast request, 3 = Broadcast response
    // gscph.command  = 0x07FF80 // 12 bits Command number
    // gscph.revision = 0x00007c // 5 bits Command revision
    // gscph.erro     = 0x000003 // 2 bits 0 = No error, 1 = Command error, 2 = Protocol error, 3 = Not defined
    //
    let a;
    let bitheader;

    a = 0;
    a += protocol << 21;
    //node.warn("dbg01: a ="+a);
    a += method << 19;
    //node.warn("dbg01: a ="+a);
    a += command << 7;
    //node.warn("dbg01: a ="+a);
    a += revision << 2;
    //node.warn("dbg01: a ="+a.toString(16));
    bitheader = (a.toString(16)).padStart(6,"0");
    commandlength = ((bitheader.length + payload.length + 1).toString(16)).padStart(4,"0");
    let ret = "!" + commandlength + "!" + bitheader + "!" + payload;

    return ret;
};

const decodeheader = (msg) => {
    //Perhaps some code to verify that we acctually got the initial '!', if not discard. 
    //Same for the length, verify length in the header to the actual recived length, if no match discard. 
    //
    msg = msg.toString('utf8');
    let response = msg.substring(1).split("!"); //skip first !  

    // Header masks
    const gscph_protocol_mask = 0xe00000 // 3 bits Protocol version
    const gscph_method_mask = 0x180000 // 2 bits 0 = Unicast request, 1 = Unicast response, 2 = Broadcast request, 3 = Broadcast response
    const gscph_command_mask = 0x07FF80 // 12 bits Command number
    const gscph_revision_mask = 0x00007c // 5 bits Command revision
    const gscph_error_mask = 0x000003 // 2 bits 0 = No error, 1 = Command error, 2 = Protocol error, 3 = Not defined

    let error = gscph_error_mask & parseInt(response[1],16);
    let revision = (gscph_revision_mask & parseInt(response[1],16)) >> 2;
    let command = (gscph_command_mask & parseInt(response[1],16)) >> 7;
    let method = (gscph_method_mask & parseInt(response[1],16)) >> 19;
    let protocol = (gscph_protocol_mask & parseInt(response[1],16)) >> 21;
    let length = response[0];
    let payload = response[2]

    return {error: error, revision: revision, command: command, method: method, protocol: protocol, length: length, payload: payload}
};

const decode = (msg) => {
    const header = decodeheader(msg);
    const params = header.payload.split(";");
    let data = {};
    switch(header.command) {
        case 82:
            data = decode82(params);
            break;
        case 401:
            data = decode401(params);
            break;
        case 412:
            data = decode412(params);
            break;
        }
    return {...header, ...data};
};

const decode82 = (data) => {
    let msg = {};

    // 1	band.index	int	Band index (0 - 15, None band cannot be changed)
    // 2	band.name	string	Band name (20 characters maximum)
    // 3	band.cutoff.lower	int	Lower cutoff frequency (0 - 2147483647 hertz)
    // 4	band.cutoff.upper	int	Upper cutoff frequency (0 - 2147483647 hertz)
    msg.band_index = parseInt(data[0]);
    msg.band_name= data[1];
    msg.band_cutoff_lower = parseInt(data[2]);
    msg.band_cutoff_upper = parseInt(data[3]);

    return msg;
};

const decode401 = (data) => {
    let msg = {};

    msg.portA_mode = parseInt(data[0]);
    msg.portA_band = parseInt(data[1]);
    msg.portA_inhibit = parseInt(data[2]);
    msg.portA_antenna = parseInt(data[3]);
    msg.portA_profile = parseInt(data[4]);
    msg.portA_tx = parseInt(data[5]);		
    msg.portB_mode = parseInt(data[6]);
    msg.portB_band = parseInt(data[7]);
    msg.portB_inhibit = parseInt(data[8]);
    msg.portB_antenna = parseInt(data[9]);
    msg.portB_profile = parseInt(data[10]);
    msg.portB_tx = parseInt(data[11]);		
    msg.stackReach = parseInt(data[12]);

    return msg;
};

const decode412 = (data) => {
    let msg = {};

    // 0	antenna.index	int	Antenna index (1 - 32)
    // 1	antenna.name	string	Antenna name (20 characters maximum)
    // 2	antenna.mode	int	Antenna mode (1 = RX only, 2 = TX only, 3 = RX and TX)
    // 3	antenna.bands	string	Hex representation of bands bitfield (2 bytes)
    msg.antenna_index = parseInt(data[0]);
    msg.antenna_name= data[1];
    msg.antenna_mode = parseInt(data[2]);
    let parameters = parseInt(data[3],16);
    msg.antenna_bands = [];
    msg.antenna_bands.push(1 & (parameters));
    msg.antenna_bands.push(1 & (parameters >> 1));
    msg.antenna_bands.push(1 & (parameters >> 2));
    msg.antenna_bands.push(1 & (parameters >> 3));
    msg.antenna_bands.push(1 & (parameters >> 4));
    msg.antenna_bands.push(1 & (parameters >> 5));
    msg.antenna_bands.push(1 & (parameters >> 6));
    msg.antenna_bands.push(1 & (parameters >> 7));
    msg.antenna_bands.push(1 & (parameters >> 8));
    msg.antenna_bands.push(1 & (parameters >> 9));
    msg.antenna_bands.push(1 & (parameters >> 10));
    msg.antenna_bands.push(1 & (parameters >> 11));
    msg.antenna_bands.push(1 & (parameters >> 12));
    msg.antenna_bands.push(1 & (parameters >> 13));
    msg.antenna_bands.push(1 & (parameters >> 14));
    msg.antenna_bands.push(1 & (parameters >> 15));

    return msg;
}

exports.encode = encode;
exports.decode = decode;