const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Clutter = imports.gi.Clutter;
const Lang = imports.lang;

const Gettext = imports.gettext.domain('ping-monitor');

let extension = imports.misc.extensionUtils.getCurrentExtension();
let convenience = extension.imports.convenience;
let Compat = extension.imports.compat;

const _ = Gettext.gettext;
const N_ = function (e) {
    return e;
};

let Schema;

function init() {
    // convenience.initTranslations();
    Schema = convenience.getSettings();
}

String.prototype.capitalize = function () {
    return this.replace(/(^|\s)([a-z])/g, function (m, p1, p2) {
        return p1 + p2.toUpperCase();
    });
};

function color_to_hex(color) {
    var output = N_('#%02x%02x%02x%02x').format(
        255 * color.red,
        255 * color.green,
        255 * color.blue,
        255 * color.alpha);
    return output;
}

const ColorSelect = new Lang.Class({
    Name: 'PingMonitor.ColorSelect',

    _init: function (name) {
        this.label = new Gtk.Label({label: name + _(':')});
        this.picker = new Gtk.ColorButton();
        this.actor = new Gtk.HBox({spacing: 5});
        this.actor.add(this.label);
        this.actor.add(this.picker);
        this.picker.set_use_alpha(true);
    },
    set_value: function (value) {
        let clutterColor = Compat.color_from_string(value);
        let color = new Gdk.RGBA();
        let ctemp = [clutterColor.red, clutterColor.green, clutterColor.blue, clutterColor.alpha / 255];
        color.parse('rgba(' + ctemp.join(',') + ')');
        this.picker.set_rgba(color);
    }
});

const IntSelect = new Lang.Class({
    Name: 'PingMonitor.IntSelect',

    _init: function (name) {
        this.label = new Gtk.Label({label: name + _(':')});
        this.spin = new Gtk.SpinButton();
        this.actor = new Gtk.HBox();
        this.actor.add(this.label);
        this.actor.add(this.spin);
        this.spin.set_numeric(true);
    },
    set_args: function (minv, maxv, incre, page) {
        this.spin.set_range(minv, maxv);
        this.spin.set_increments(incre, page);
    },
    set_value: function (value) {
        this.spin.set_value(value);
    }
});

const Select = new Lang.Class({
    Name: 'PingMonitor.Select',

    _init: function (name) {
        this.label = new Gtk.Label({label: name + _(':')});
        // this.label.set_justify(Gtk.Justification.RIGHT);
        this.selector = new Gtk.ComboBoxText();
        this.actor = new Gtk.HBox({spacing: 5});
        this.actor.add(this.label);
        this.actor.add(this.selector);
    },
    set_value: function (value) {
        this.selector.set_active(value);
    },
    add: function (items) {
        items.forEach(Lang.bind(this, function (item) {
            this.selector.append_text(item);
        }));
    }
});

function set_enum(combo, schema, name) {
    Schema.set_enum(name, combo.get_active());
}

function set_color(color, schema, name) {
    Schema.set_string(name, color_to_hex(color.get_rgba()))
}

function set_string(combo, schema, name, _slist) {
    Schema.set_string(name, _slist[combo.get_active()]);
}

/*
const SettingFrame = new Lang.Class({
    Name: 'PingMonitor.SettingFrame',

    _init: function (name, schema) {
        this.schema = schema;
        this.label = new Gtk.Label({label: name});
        this.frame = new Gtk.Frame({border_width: 10});

        this.vbox = new Gtk.VBox({spacing: 20});
        this.hbox0 = new Gtk.HBox({spacing: 20});
        this.hbox1 = new Gtk.HBox({spacing: 20});
        this.hbox2 = new Gtk.HBox({spacing: 20});
        this.hbox3 = new Gtk.HBox({spacing: 20});
        this.frame.add(this.vbox);
        this.vbox.pack_start(this.hbox0, true, false, 0);
        this.vbox.pack_start(this.hbox1, true, false, 0);
        this.vbox.pack_start(this.hbox2, true, false, 0);
        this.vbox.pack_start(this.hbox3, true, false, 0);
    },

    // Enforces child ordering of first 2 boxes by label
    _reorder: function () {
        // @return {string} label of/inside component
        const labelOf = el => {
            if (el.get_children) {
                return labelOf(el.get_children()[0]);
            }
            return el && el.label || '';
        };

        [this.hbox0, this.hbox1].forEach(box => {
            box.get_children()
                .sort((c1, c2) => labelOf(c1).localeCompare(labelOf(c2)))
                .forEach((child, index) => box.reorder_child(child, index));
        });
    },

    add: function (key) {
        const configParent = key.substring(0, key.indexOf('-'));
        const config = key.substring(configParent.length + 1);

        // hbox0
        if (config === 'display') {
            let item = new Gtk.CheckButton({label: _('Display')});
            this.hbox0.add(item);
            Schema.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);
        } else if (config === 'show-text') {
            let item = new Gtk.CheckButton({label: _('Show Text')});
            this.hbox0.add(item);
            Schema.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);
        } else if (config === 'show-menu') {
            let item = new Gtk.CheckButton({label: _('Show In Menu')});
            this.hbox0.add(item);
            Schema.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);
        // hbox1
        } else if (config === 'refresh-time') {
            let item = new IntSelect(_('Refresh Time'));
            item.set_args(50, 100000, 1000, 5000);
            this.hbox1.add(item.actor);
            Schema.bind(key, item.spin, 'value', Gio.SettingsBindFlags.DEFAULT);
        } else if (config === 'graph-width') {
            let item = new IntSelect(_('Graph Width'));
            item.set_args(1, 1000, 1, 10);
            this.hbox1.add(item.actor);
            Schema.bind(key, item.spin, 'value', Gio.SettingsBindFlags.DEFAULT);
        } else if (config === 'style') {
            let item = new Select(_('Display Style'));
            item.add([_('digit'), _('graph'), _('both')]);
            item.set_value(this.schema.get_enum(key));
            this.hbox1.add(item.actor);
            item.selector.connect('changed', function (style) {
                set_enum(style, Schema, key);
            });
            // Schema.bind(key, item.selector, 'active', Gio.SettingsBindFlags.DEFAULT);
        // hbox2
        } else if (config.match(/-color$/)) {
            let item = new ColorSelect(_(config.split('-')[0].capitalize()));
            item.set_value(this.schema.get_string(key));
            this.hbox2.pack_end(item.actor, true, false, 0);
            item.picker.connect('color-set', function (color) {
                set_color(color, Schema, key);
            });
        } else if (config.match(/sensor/)) {
            let sensor_type = configParent === 'fan' ? 'fan' : 'temp';
            let [_slist, _strlist] = check_sensors(sensor_type);
            let item = new Select(_('Sensor'));
            if (_slist.length === 0) {
                item.add([_('Please install lm-sensors')]);
            } else if (_slist.length === 1) {
                this.schema.set_string(key, _slist[0]);
            }
            item.add(_strlist);
            try {
                item.set_value(_slist.indexOf(this.schema.get_string(key)));
            } catch (e) {
                item.set_value(0);
            }
            // this.hbox3.add(item.actor);
            if (configParent === 'fan') {
                this.hbox2.pack_end(item.actor, true, false, 0);
            } else {
                this.hbox2.pack_start(item.actor, true, false, 0);
            }
            item.selector.connect('changed', function (combo) {
                set_string(combo, Schema, key, _slist);
            });
        // hbox3
        } else if (config === 'speed-in-bits') {
            let item = new Gtk.CheckButton({label: _('Show network speed in bits')});
            this.hbox3.add(item);
            Schema.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);
        } else if (config === 'individual-cores') {
            let item = new Gtk.CheckButton({label: _('Display Individual Cores')});
            this.hbox3.add(item);
            Schema.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);
        } else if (config === 'time') {
            let item = new Gtk.CheckButton({label: _('Show Time Remaining')});
            this.hbox3.add(item);
            Schema.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);
        } else if (config === 'hidesystem') {
            let item = new Gtk.CheckButton({label: _('Hide System Icon')});
            this.hbox3.add(item);
            Schema.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);
        } else if (config === 'usage-style') {
            let item = new Select(_('Usage Style'));
            item.add([_('pie'), _('bar'), _('none')]);
            item.set_value(this.schema.get_enum(key));
            this.hbox3.pack_end(item.actor, false, false, 20);

            item.selector.connect('changed', function (style) {
                set_enum(style, Schema, key);
            });
        } else if (config === 'fahrenheit-unit') {
            let item = new Gtk.CheckButton({label: _('Display temperature in Fahrenheit')});
            this.hbox3.add(item);
            Schema.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);
        } else if (config === 'threshold') {
            let item = new IntSelect(_('Temperature threshold (0 to disable)'));
            item.set_args(0, 300, 5, 5);
            this.hbox3.add(item.actor);
            Schema.bind(key, item.spin, 'value', Gio.SettingsBindFlags.DEFAULT);
        }
        if (configParent.indexOf('gpu') !== -1 &&
            config === 'display') {
            let item = new Gtk.Label({label: _('** Only Nvidia GPUs supported so far **')});
            this.hbox3.add(item);
        }
        this._reorder();
    }
});
*/

const App = new Lang.Class({
    Name: 'PingMonitor.App',

    _init: function () {
        let keys = Schema.list_keys();

        this.items = [];

        this.main_vbox = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL,
            spacing: 10,
            border_width: 10});
        this.hbox1 = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 20,
            border_width: 10
        });
        this.main_vbox.pack_start(this.hbox1, false, false, 0);
        this.hbox2 = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 20,
            border_width: 10
        });
        this.main_vbox.pack_start(this.hbox2, false, false, 0);

        // Colors
        // Good
        let item = new ColorSelect(_('Good'));
        item.set_value(Schema.get_string('ping-good-color'));
        this.items.push(item);
        this.hbox1.pack_start(item.actor, true, false, 0);
        item.picker.connect('color-set', function (color) {
            set_color(color, Schema, 'ping-good-color');
        });
        // Warning
        item = new ColorSelect(_('Warning'));
        item.set_value(Schema.get_string('ping-warning-color'));
        this.items.push(item);
        this.hbox1.pack_start(item.actor, true, false, 0);
        item.picker.connect('color-set', function (color) {
            set_color(color, Schema, 'ping-warning-color');
        });
        // Bad
        item = new ColorSelect(_('Bad'));
        item.set_value(Schema.get_string('ping-bad-color'));
        this.items.push(item);
        this.hbox1.pack_start(item.actor, true, false, 0);
        item.picker.connect('color-set', function (color) {
            set_color(color, Schema, 'ping-bad-color');
        });
        // Loss
        item = new ColorSelect(_('Loss'));
        item.set_value(Schema.get_string('ping-loss-color'));
        this.items.push(item);
        this.hbox1.pack_start(item.actor, true, false, 0);
        item.picker.connect('color-set', function (color) {
            set_color(color, Schema, 'ping-loss-color');
        });

        // Config path
        item = new Gtk.Label({label: 'Configuration path'});
        this.hbox2.add(item);
        // File chooser
        item = new Gtk.FileChooserButton({title: _('Open configuration file')});
        item.set_current_folder(GLib.getenv('HOME') + '/.config');
        item.set_filename(Schema.get_string('ping-config-path'));
        this.items.push(item);
        this.hbox2.add(item);
        item.connect('file-set',Lang.bind(this, function (button) {
            let path = button.get_filename();
            let oldPath = Schema.get_string('ping-config-path');
            if (path !== oldPath) {
                Schema.set_string('ping-config-path', path);
            }
        }));

        this.main_vbox.show_all();
    }
});

function buildPrefsWidget() {
    let widget = new App();
    return widget.main_vbox;
}
