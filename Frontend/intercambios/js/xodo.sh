#!/bin/bash
while true; do
    xdotool mousemove_relative 1 0
    sleep 5
    xdotool mousemove_relative -- -1 0
    sleep 55
done
