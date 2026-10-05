package com.toastygames.littlesproutpark;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Lets the game tell the widget that today's play time is used up, so the widget rests too. That is the only thing it passes. */
@CapacitorPlugin(name = "SproutWidget")
public class SproutWidgetBridge extends Plugin {
    @PluginMethod
    public void setRest(PluginCall call) {
        boolean reached = Boolean.TRUE.equals(call.getBoolean("reached", false));
        boolean was = SproutMiniWidget.resting(getContext());
        SproutMiniWidget.prefs(getContext()).edit().putString("rest", reached ? SproutMiniWidget.today() : "").apply();
        if (was != reached) SproutMiniWidget.refreshAll(getContext());
        call.resolve();
    }
}
