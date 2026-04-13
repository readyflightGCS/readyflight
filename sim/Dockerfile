## Taken (almost entirely) from https://github.com/radarku/ardupilot-sitl-docker


FROM ardupilot/ardupilot-dev-base

ARG COPTER_TAG=Copter-4.5.7

# install git 
RUN apt-get update && apt-get install -y git; git config --global url."https://github.com/".insteadOf git://github.com/

# Now grab ArduPilot from GitHub
RUN git clone https://github.com/ArduPilot/ardupilot.git ardupilot
WORKDIR ardupilot

# Checkout the latest Copter...
RUN git checkout ${COPTER_TAG}

# Now start build instructions from http://ardupilot.org/dev/docs/setting-up-sitl-on-linux.html
RUN git submodule update --init --recursive

# Trick to get apt-get to not prompt for timezone in tzdata
ENV DEBIAN_FRONTEND=noninteractive

# Need sudo and lsb-release for the installation prerequisites
RUN apt-get install -y sudo lsb-release tzdata

# Continue build instructions from https://github.com/ArduPilot/ardupilot/blob/master/BUILD.md
RUN ./waf distclean
RUN ./waf configure --board sitl
RUN ./waf copter

# TCP 5760 is what the sim exposes by default
EXPOSE 5760/tcp
EXPOSE 14550/udp

ENV PATH="/usr/local/bin:/root/.local/bin:${PATH}"

RUN pip3 install --no-cache-dir MAVProxy pymavlink # Install MAVProxy

ENV SITL_UDP_OUTPUT_ADDRESS udp:127.0.0.1:14550
