# Generated by Django 2.0.3 on 2018-08-06 02:34

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('engine', '0001_release_v0_1_0'),
    ]

    operations = [
        migrations.AddField(
            model_name='job',
            name='updated_date',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]
