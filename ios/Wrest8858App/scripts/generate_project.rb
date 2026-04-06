#!/usr/bin/env ruby
require 'fileutils'
require 'xcodeproj'

root = File.expand_path('..', __dir__)
project_path = File.join(root, 'Wrest8858App.xcodeproj')
FileUtils.rm_rf(project_path)

project = Xcodeproj::Project.new(project_path)
app_target = project.new_target(:application, 'Wrest8858App', :ios, '18.0')

sources_group = project.main_group.new_group('Sources', 'Sources')
resources_group = project.main_group.new_group('Resources', 'Resources')

Dir.glob(File.join(root, 'Sources', '*.swift')).sort.each do |path|
  file_ref = sources_group.new_file(File.basename(path))
  app_target.source_build_phase.add_file_reference(file_ref)
end

resources_group.new_file('Info.plist')
assets = resources_group.new_file('Assets.xcassets')
launch_storyboard = resources_group.new_file('LaunchScreen.storyboard')
privacy_manifest = resources_group.new_file('PrivacyInfo.xcprivacy')
app_target.resources_build_phase.add_file_reference(assets)
app_target.resources_build_phase.add_file_reference(launch_storyboard)
app_target.resources_build_phase.add_file_reference(privacy_manifest)

project.build_configurations.each do |config|
  config.build_settings['SWIFT_VERSION'] = '5.0'
end

app_target.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.jaimeespinalpr.wrest8858app'
  config.build_settings['INFOPLIST_FILE'] = 'Resources/Info.plist'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'NO'
  config.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '18.0'
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
  config.build_settings['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon'
  config.build_settings['ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME'] = 'AccentColor'
  config.build_settings['ENABLE_PREVIEWS'] = 'YES'
  config.build_settings['SWIFT_VERSION'] = '5.0'
end

scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app_target)
scheme.set_launch_target(app_target)
scheme.save_as(project_path, 'Wrest8858App', true)

project.save
puts "Generated: #{project_path}"
